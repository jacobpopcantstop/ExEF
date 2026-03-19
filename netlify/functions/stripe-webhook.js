const crypto = require('crypto');
const { json, requiredEnv, log, normalizeEmail } = require('./_common');
const db = require('./_db');

const OFFER_PURCHASES = {
  cefc_enrollment: [{ id: 'cefc-enrollment', name: 'CEFC Enrollment Access', price: 695 }],
  capstone_review: [{ id: 'capstone-review', name: 'Capstone Review & Credentialing', price: 350 }],
  cefc_bundle: [
    { id: 'cefc-enrollment', name: 'CEFC Enrollment Access', price: 695 },
    { id: 'capstone-review', name: 'Capstone Review & Credentialing', price: 200 }
  ],
  esqr_analysis: [{ id: 'esqr-analysis', name: 'ESQ-R Professional Analysis', price: 199 }]
};

function b64urlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function signingSecret() {
  return requiredEnv('EFI_PURCHASE_SIGNING_SECRET') || requiredEnv('EFI_DOWNLOAD_SIGNING_SECRET') || 'efi-dev-signing-secret';
}

function sign(payload) {
  return crypto.createHmac('sha256', signingSecret()).update(payload).digest('base64url');
}

function makeReceipt(payloadObj) {
  const payload = b64urlEncode(JSON.stringify(payloadObj));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function makeCredentialId(email) {
  const lower = String(email || '').toLowerCase();
  let h = 0;
  for (let i = 0; i < lower.length; i++) {
    h = ((h << 5) - h) + lower.charCodeAt(i);
    h |= 0;
  }
  return 'EFI-CEFC-' + Math.abs(h).toString(36).toUpperCase().substring(0, 8);
}

async function fulfillCheckoutSession(obj, paymentIntentId) {
  const offer = String((obj.metadata && obj.metadata.offer) || '').trim();
  const email = normalizeEmail(
    (obj.customer_details && obj.customer_details.email) ||
    obj.customer_email ||
    (obj.metadata && obj.metadata.email) ||
    ''
  );

  if (!offer || !email || !paymentIntentId) return { fulfilled: false, reason: 'missing_offer_email_or_payment_intent' };
  const items = OFFER_PURCHASES[offer];
  if (!items) return { fulfilled: false, reason: 'unsupported_offer' };

  const existing = await db.findPurchaseByPaymentIntent(paymentIntentId).catch(() => ({ found: false }));
  if (existing && existing.found) {
    return { fulfilled: true, existing: true, purchaseId: existing.purchase && existing.purchase.id };
  }

  const now = new Date().toISOString();
  const purchaseId = 'ord_' + crypto.randomBytes(6).toString('hex');
  const credentialId = makeCredentialId(email);
  const receipt = makeReceipt({
    v: 1,
    purchase_id: purchaseId,
    issued_at: now,
    email,
    items: items.map((item) => String(item.id || '')),
    credential_id: credentialId
  });

  await db.addPurchase(email, {
    id: purchaseId,
    date: now,
    total: items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    items: items.map((item) => ({ ...item })),
    receipt,
    credentialId,
    paymentIntentId,
    offerCode: offer
  });

  return { fulfilled: true, existing: false, purchaseId };
}

function verifyStripeSignature(rawBody, headerValue, secret) {
  if (!headerValue || !secret) return false;
  const parts = String(headerValue).split(',');
  const tsPart = parts.find((p) => p.startsWith('t='));
  const sigPart = parts.find((p) => p.startsWith('v1='));
  if (!tsPart || !sigPart) return false;

  const ts = tsPart.substring(2);
  const provided = sigPart.substring(3);
  const signedPayload = `${ts}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

exports.handler = async function (event) {
  try {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const rawBody = event.body || '';
  const stripeSecret = requiredEnv('STRIPE_WEBHOOK_SECRET');
  const demoSecret = requiredEnv('EFI_WEBHOOK_DEMO_SECRET');

  if (stripeSecret) {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    if (!verifyStripeSignature(rawBody, sig, stripeSecret)) {
      return json(400, { ok: false, error: 'Invalid Stripe signature' });
    }
  } else if (demoSecret) {
    const header = event.headers['x-efi-webhook-secret'] || '';
    if (header !== demoSecret) return json(401, { ok: false, error: 'Invalid demo webhook secret' });
  } else {
    return json(503, { ok: false, error: 'Webhook secret not configured' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return json(400, { ok: false, error: 'Invalid JSON payload' });
  }

  log.info('stripe webhook', { type: payload.type });
  const eventType = String(payload.type || 'unknown');
  const obj = payload.data && payload.data.object ? payload.data.object : {};
  let paymentIntentId = '';
  let email = '';
  let amount = null;
  let currency = null;
  let status = 'unknown';

  if (eventType === 'payment_intent.succeeded') {
    paymentIntentId = String(obj.id || '');
    email = String((obj.receipt_email || (obj.metadata && obj.metadata.email) || '')).toLowerCase();
    amount = typeof obj.amount_received === 'number' ? obj.amount_received / 100 : null;
    currency = String(obj.currency || '').toUpperCase();
    status = 'succeeded';
  } else if (eventType === 'checkout.session.completed') {
    paymentIntentId = String(obj.payment_intent || '');
    email = String((obj.customer_details && obj.customer_details.email) || (obj.metadata && obj.metadata.email) || '').toLowerCase();
    amount = typeof obj.amount_total === 'number' ? obj.amount_total / 100 : null;
    currency = String(obj.currency || '').toUpperCase();
    status = 'succeeded';
  } else if (eventType === 'payment_intent.payment_failed') {
    paymentIntentId = String(obj.id || '');
    email = String((obj.receipt_email || (obj.metadata && obj.metadata.email) || '')).toLowerCase();
    amount = typeof obj.amount === 'number' ? obj.amount / 100 : null;
    currency = String(obj.currency || '').toUpperCase();
    status = 'failed';
  }

  if (paymentIntentId && status === 'succeeded') {
    log.info('payment complete', { email, amount });
  }
  if (paymentIntentId) {
    await db.savePaymentIntent(paymentIntentId, {
      status,
      email: email || null,
      amount,
      currency,
      raw: payload
    });
  }

  if (eventType === 'checkout.session.completed' && paymentIntentId && status === 'succeeded') {
    const fulfillment = await fulfillCheckoutSession(obj, paymentIntentId).catch((err) => {
      log.error('stripe fulfillment error', { payment_intent_id: paymentIntentId, error: err.message });
      return { fulfilled: false, reason: 'exception' };
    });
    if (fulfillment.fulfilled) {
      log.info('stripe fulfillment complete', {
        payment_intent_id: paymentIntentId,
        purchase_id: fulfillment.purchaseId || null,
        existing: !!fulfillment.existing
      });
    }
  }

  return json(200, { ok: true, received: true, event_type: eventType, payment_intent_id: paymentIntentId || null });
  } catch (err) {
    log.error('stripe webhook error', { error: err.message });
    return json(500, { ok: false, error: 'Internal server error' });
  }
};
