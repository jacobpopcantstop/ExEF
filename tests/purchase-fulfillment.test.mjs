import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../netlify/functions/_db.js');
const verify = require('../netlify/functions/verify.js');
const stripeWebhook = require('../netlify/functions/stripe-webhook.js');

test('issue_purchase is idempotent for a verified Stripe payment intent', async () => {
  const originalEnforce = process.env.EFI_STRIPE_ENFORCE;
  process.env.EFI_STRIPE_ENFORCE = 'true';

  const email = 'stripe-buyer@example.com';
  const paymentIntentId = 'pi_' + Date.now().toString(36);

  try {
    await db.savePaymentIntent(paymentIntentId, {
      status: 'succeeded',
      email,
      amount: 199,
      currency: 'USD',
      raw: { id: paymentIntentId }
    });

    const first = await verify.handler({
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'issue_purchase',
        email,
        offer: 'esqr_analysis',
        payment_intent_id: paymentIntentId
      })
    });

    assert.equal(first.statusCode, 200);
    const firstBody = JSON.parse(first.body);
    assert.equal(firstBody.ok, true);
    assert.equal(firstBody.purchase.paymentIntentId, paymentIntentId);
    assert.equal(firstBody.purchase.items.length, 1);

    const second = await verify.handler({
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'issue_purchase',
        email,
        offer: 'esqr_analysis',
        payment_intent_id: paymentIntentId
      })
    });

    assert.equal(second.statusCode, 200);
    const secondBody = JSON.parse(second.body);
    assert.equal(secondBody.ok, true);
    assert.equal(secondBody.purchase.id, firstBody.purchase.id);

    const purchases = await db.listPurchases(email);
    assert.equal((purchases.purchases || []).filter((purchase) => purchase.paymentIntentId === paymentIntentId).length, 1);
  } finally {
    process.env.EFI_STRIPE_ENFORCE = originalEnforce;
  }
});

test('stripe checkout.session.completed fulfills a purchase once per payment intent', async () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.EFI_WEBHOOK_DEMO_SECRET = 'demo-webhook-secret';

  const paymentIntentId = 'pi_webhook_' + Date.now().toString(36);
  const payload = {
    type: 'checkout.session.completed',
    data: {
      object: {
        payment_intent: paymentIntentId,
        customer_email: 'webhook-buyer@example.com',
        customer_details: { email: 'webhook-buyer@example.com' },
        amount_total: 19900,
        currency: 'usd',
        metadata: {
          offer: 'esqr_analysis',
          email: 'webhook-buyer@example.com',
          offer_label: 'ESQ-R Professional Analysis'
        }
      }
    }
  };

  try {
    const first = await stripeWebhook.handler({
      httpMethod: 'POST',
      headers: { 'x-efi-webhook-secret': 'demo-webhook-secret' },
      body: JSON.stringify(payload)
    });

    assert.equal(first.statusCode, 200);

    const second = await stripeWebhook.handler({
      httpMethod: 'POST',
      headers: { 'x-efi-webhook-secret': 'demo-webhook-secret' },
      body: JSON.stringify(payload)
    });

    assert.equal(second.statusCode, 200);

    const purchases = await db.listPurchases('webhook-buyer@example.com');
    const matches = (purchases.purchases || []).filter((purchase) => purchase.paymentIntentId === paymentIntentId);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].offerCode, 'esqr_analysis');
    assert.equal(matches[0].items.length, 1);
  } finally {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    delete process.env.EFI_WEBHOOK_DEMO_SECRET;
  }
});
