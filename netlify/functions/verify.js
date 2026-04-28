const crypto = require('crypto');
const { json, parseBody, requiredEnv } = require('./_common');
const { getActor } = require('./_authz');
const db = require('./_db');

const OFFER_PURCHASES = {
  cefc_enrollment: {
    items: [{ id: 'cefc-enrollment', name: 'CEFC Enrollment Access', price: 695 }]
  },
  capstone_review: {
    items: [{ id: 'capstone-review', name: 'Capstone Review & Credentialing', price: 350 }]
  },
  cefc_bundle: {
    items: [
      { id: 'cefc-enrollment', name: 'CEFC Enrollment Access', price: 695 },
      { id: 'capstone-review', name: 'Capstone Review & Credentialing', price: 200 }
    ]
  },
  esqr_analysis: {
    items: [{ id: 'esqr-analysis', name: 'ESQ-R Professional Analysis', price: 199 }]
  }
};

function b64urlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function b64urlDecode(input) {
  return Buffer.from(String(input || ''), 'base64url').toString('utf8');
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

function verifyReceiptToken(token) {
  if (!token || token.indexOf('.') === -1) return { ok: false, error: 'Invalid receipt token' };
  const parts = token.split('.');
  const payload = parts[0];
  const signature = parts[1];
  if (!payload || !signature) return { ok: false, error: 'Invalid receipt token' };

  const expected = sign(payload);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Signature mismatch' };
  }

  try {
    const decoded = JSON.parse(b64urlDecode(payload));
    return { ok: true, receipt: decoded };
  } catch (err) {
    return { ok: false, error: 'Malformed receipt payload' };
  }
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

function getClientIp(event) {
  const forwarded = String((event.headers && event.headers['x-forwarded-for']) || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return String((event.headers && (event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'])) || '').trim() || null;
}

function resolveAuditActor(actor, email, fallbackRole) {
  return {
    actor_role: (actor && actor.role && actor.role !== 'guest') ? actor.role : (fallbackRole || 'public'),
    actor_email: (actor && actor.email) || email || null
  };
}

async function saveAudit(entry) {
  return db.saveAuditLog(entry).catch(() => null);
}

function csrfSecret() {
  return requiredEnv('EFI_CSRF_SIGNING_SECRET') || 'efi-dev-csrf-secret';
}

function signCsrfPayload(raw) {
  return crypto.createHmac('sha256', csrfSecret()).update(raw).digest('hex');
}

function decodeBase64Url(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function verifyCsrfToken(token, actor) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return false;
  const encoded = parts[0];
  const providedSig = parts[1];
  const expectedSig = signCsrfPayload(encoded);
  if (providedSig !== expectedSig) return false;

  let payload = null;
  try {
    payload = JSON.parse(decodeBase64Url(encoded));
  } catch (err) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || !payload.exp || payload.exp < now) return false;
  if (String(payload.role || '') !== String(actor.role || '')) return false;
  if (payload.email && actor.email && String(payload.email).toLowerCase() !== String(actor.email).toLowerCase()) return false;
  return true;
}

function isPrivilegedRole(role) {
  return role === 'admin' || role === 'reviewer';
}

function hasManagedAuth() {
  return !!(requiredEnv('SUPABASE_URL') && requiredEnv('SUPABASE_ANON_KEY'));
}

async function authorizePurchaseActor(event, email) {
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  if (!hasManagedAuth()) return { ok: true, actor };
  if (!actor || !actor.email) {
    return { ok: false, statusCode: 401, error: 'Managed authentication required', actor };
  }
  const normalizedActor = String(actor.email || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!isPrivilegedRole(actor.role) && normalizedActor !== normalizedEmail) {
    return { ok: false, statusCode: 403, error: 'You may only issue purchases for your own account', actor };
  }
  return { ok: true, actor };
}

function resolvePurchaseItems(body) {
  const offerCode = String(body.offer || '').trim();
  if (offerCode) {
    const offer = OFFER_PURCHASES[offerCode];
    if (!offer) {
      return { ok: false, error: 'Unsupported offer' };
    }
    return {
      ok: true,
      offerCode,
      items: offer.items.map((item) => ({ ...item }))
    };
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return { ok: false, error: 'At least one item is required' };
  return { ok: true, offerCode: null, items };
}

function normalizePurchaseForQueue(purchase) {
  const items = Array.isArray(purchase.items) ? purchase.items : [];
  const hasCertificate = items.some((item) => String(item.id || '') === 'certificate');
  const hasFramed = items.some((item) => String(item.id || '') === 'certificate-frame');
  return {
    id: purchase.id,
    email: purchase.email || null,
    date: purchase.date,
    total: Number(purchase.total || 0),
    items,
    receipt: purchase.receipt || null,
    credentialId: purchase.credentialId || null,
    hasCertificate,
    hasFramed,
    verificationMode: purchase.verification && purchase.verification.mode ? purchase.verification.mode : null,
    reviewerDecision: purchase.reviewerDecision || null,
    reviewerNotes: purchase.reviewerNotes || null,
    reviewedAt: purchase.reviewedAt || null,
    reviewedBy: purchase.reviewedBy || null
  };
}

async function issuePurchase(body, event) {
  const email = String(body.email || '').trim().toLowerCase();
  const purchaseSpec = resolvePurchaseItems(body);
  if (!purchaseSpec.ok) return json(400, { ok: false, error: purchaseSpec.error });
  const items = purchaseSpec.items;
  const authz = await authorizePurchaseActor(event, email);
  if (!authz.ok) return json(authz.statusCode, { ok: false, error: authz.error });
  const actor = authz.actor;
  const auditActor = resolveAuditActor(actor, email, 'learner');
  const ip = getClientIp(event);
  const userAgent = event.headers['user-agent'] || null;
  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!items.length) return json(400, { ok: false, error: 'At least one item is required' });

  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const requestedIds = items.map((i) => String(i.id || '').trim());

  if (requestedIds.some((id) => id === 'certificate' || id === 'certificate-frame')) {
    const progressRow = await db.getProgress(email).catch(() => ({ found: false, progress: null }));
    const progress = progressRow && progressRow.progress ? progressRow.progress : {};
    const modules = progress.modules && typeof progress.modules === 'object' ? progress.modules : {};
    const capstone = progress.capstone && typeof progress.capstone === 'object' ? progress.capstone : {};

    const requiredModuleIds = ['1', '2', '3', '4', '5', '6'];
    const modulePassByProgress = requiredModuleIds.reduce((acc, id) => {
      acc[id] = !!modules[id];
      return acc;
    }, {});

    const submissionsRow = await db.listSubmissions(email).catch(() => ({ submissions: [] }));
    const submissions = Array.isArray(submissionsRow.submissions) ? submissionsRow.submissions : [];
    const latestByModule = {};
    let capstonePassedFromSubmissions = false;
    submissions.forEach((row) => {
      if (row.kind === 'module' && row.module_id) {
        const key = String(row.module_id);
        const prev = latestByModule[key];
        if (!prev || String(prev.submitted_at || '') < String(row.submitted_at || '')) {
          latestByModule[key] = row;
        }
      }
      if (row.kind === 'capstone') {
        const passed = typeof row.score === 'number' && row.score >= 75;
        if (passed) capstonePassedFromSubmissions = true;
      }
    });

    const modulePassBySubmissions = requiredModuleIds.reduce((acc, id) => {
      const row = latestByModule[id];
      acc[id] = !!(row && typeof row.score === 'number' && row.score >= 75);
      return acc;
    }, {});

    const allModulesPassed = requiredModuleIds.every((id) => modulePassByProgress[id] || modulePassBySubmissions[id]);
    const capstonePassed = (String(capstone.status || '').toLowerCase() === 'passed') || capstonePassedFromSubmissions;
    if (!allModulesPassed || !capstonePassed) {
      await saveAudit({
        ...auditActor,
        action: 'purchase.issue_denied',
        target_type: 'purchase_request',
        target_id: email,
        ip,
        user_agent: userAgent,
        metadata: {
          requested_item_ids: requestedIds,
          reason: 'certificate_requirements_not_met',
          eligibility: {
            all_modules_passed: allModulesPassed,
            capstone_passed: capstonePassed
          }
        }
      });
      return json(403, {
        ok: false,
        error: 'Certificate products require all required Pathway modules passed and capstone passed.',
        eligibility: {
          all_modules_passed: allModulesPassed,
          capstone_passed: capstonePassed
        }
      });
    }
  }

  const now = new Date().toISOString();
  const purchase = {
    id: 'ord_' + crypto.randomBytes(6).toString('hex'),
    date: now,
    total,
    items,
    offerCode: purchaseSpec.offerCode,
    verification: {
      mode: process.env.EFI_STRIPE_ENFORCE === 'true' ? 'stripe_required' : 'server_signed'
    }
  };

  if (process.env.EFI_STRIPE_ENFORCE === 'true') {
    const paymentIntentId = String(body.payment_intent_id || '').trim();
    if (!paymentIntentId) {
      return json(402, {
        ok: false,
        error: 'Live mode requires payment_intent_id validated by Stripe webhook.'
      });
    }
    const verified = await db.hasVerifiedPayment(paymentIntentId);
    if (!verified) {
      return json(402, {
        ok: false,
        error: 'Payment intent is not verified yet. Retry after webhook confirmation.'
      });
    }
    const existing = await db.findPurchaseByPaymentIntent(paymentIntentId).catch(() => ({ found: false }));
    if (existing && existing.found && existing.purchase) {
      return json(200, {
        ok: true,
        purchase: {
          id: existing.purchase.id,
          date: existing.purchase.date,
          total: existing.purchase.total,
          items: existing.purchase.items || [],
          receipt: existing.purchase.receipt || null,
          credentialId: existing.purchase.credentialId || null,
          paymentIntentId: existing.purchase.paymentIntentId || null,
          offerCode: existing.purchase.offerCode || null
        },
        receipt: existing.purchase.receipt || null,
        credential_id: existing.purchase.credentialId || null
      });
    }
    purchase.paymentIntentId = paymentIntentId;
  }

  const receiptPayload = {
    v: 1,
    purchase_id: purchase.id,
    issued_at: now,
    email,
    items: items.map((i) => String(i.id || '')),
    credential_id: makeCredentialId(email)
  };

  const receipt = makeReceipt(receiptPayload);
  await db.addPurchase(email, {
    ...purchase,
    receipt,
    credentialId: receiptPayload.credential_id
  }).catch(() => {});

  await saveAudit({
    ...auditActor,
    action: 'purchase.issued',
    target_type: 'purchase',
    target_id: purchase.id,
    ip,
    user_agent: userAgent,
    metadata: {
      email,
      requested_item_ids: requestedIds,
      total,
      verification_mode: purchase.verification.mode,
      credential_id: receiptPayload.credential_id
    }
  });

  return json(200, {
    ok: true,
    purchase,
    receipt,
    credential_id: receiptPayload.credential_id
  });
}

async function reviewCertificate(body, event) {
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
  const csrfToken = event.headers['x-efi-csrf'] || event.headers['X-EFI-CSRF'] || '';
  if (!verifyCsrfToken(csrfToken, actor)) return json(403, { ok: false, error: 'CSRF validation failed' });

  const email = String(body.email || '').trim().toLowerCase();
  const credentialId = String(body.credential_id || '').trim().toUpperCase();
  const decision = String(body.decision || '').trim().toLowerCase();
  const reviewerNotes = String(body.reviewer_notes || '').trim();

  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!['approve_release', 'hold', 'reject'].includes(decision)) {
    return json(400, { ok: false, error: 'decision must be approve_release, hold, or reject' });
  }
  if (reviewerNotes.length < 8) return json(400, { ok: false, error: 'reviewer_notes must explain the certificate decision' });

  const purchasesRow = await db.listPurchases(email).catch(() => ({ purchases: [] }));
  const certificatePurchase = (purchasesRow.purchases || []).find((purchase) => {
    const hasCertificate = (purchase.items || []).some((item) => String(item.id || '') === 'certificate');
    if (!hasCertificate) return false;
    if (!credentialId) return true;
    return String(purchase.credentialId || '').toUpperCase() === credentialId;
  });

  if (!certificatePurchase) {
    return json(404, { ok: false, error: 'Certificate purchase record not found for this learner' });
  }

  const resolvedCredentialId = String(certificatePurchase.credentialId || credentialId || '').toUpperCase() || null;
  const reviewedAt = new Date().toISOString();
  const reviewedBy = actor.email || actor.role || null;
  const persisted = await db.updatePurchaseReview(email, certificatePurchase.id, {
    reviewerDecision: decision,
    reviewerNotes,
    reviewedAt,
    reviewedBy
  });
  await saveAudit({
    actor_role: actor.role,
    actor_email: actor.email || null,
    action: 'certificate.reviewer_decision',
    target_type: 'credential',
    target_id: resolvedCredentialId || certificatePurchase.id,
    ip: getClientIp(event),
    user_agent: event.headers['user-agent'] || null,
    metadata: {
      email,
      decision,
      reviewer_notes: reviewerNotes,
      purchase_id: certificatePurchase.id,
      credential_id: resolvedCredentialId
    }
  });

  return json(200, {
    ok: true,
    decision,
    purchase_id: certificatePurchase.id,
    credential_id: resolvedCredentialId,
    purchase: normalizePurchaseForQueue((persisted && persisted.purchase) || {
      ...certificatePurchase,
      email,
      reviewerDecision: decision,
      reviewerNotes,
      reviewedAt,
      reviewedBy
    }),
    message: 'Certificate reviewer decision recorded.'
  });
}

async function listCertificateQueue(query, event) {
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });

  const email = String(query.email || '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(200, parseInt(String(query.limit || '100'), 10) || 100));
  const includeFramed = String(query.include_framed || '').trim() === '1';

  const purchasesRow = await db.listAllPurchases({
    email,
    itemId: includeFramed ? '' : 'certificate',
    limit
  });

  let purchases = (purchasesRow.purchases || []).map(normalizePurchaseForQueue);
  if (!includeFramed) purchases = purchases.filter((purchase) => purchase.hasCertificate);

  return json(200, {
    ok: true,
    storage: purchasesRow.storage,
    count: purchases.length,
    purchases
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });
    if (body.action === 'issue_purchase') {
      return issuePurchase(body, event);
    }
    if (body.action === 'review_certificate') {
      return reviewCertificate(body, event);
    }
    return json(400, { ok: false, error: 'Unsupported action' });
  }

  if (event.httpMethod === 'GET') {
    const query = event.queryStringParameters || {};
    if (String(query.review_queue || '').trim() === '1') {
      return listCertificateQueue(query, event);
    }

    const receiptToken = String(query.receipt || '').trim();
    const productId = String(query.product || '').trim();
    const credentialId = String(query.credential_id || '').trim().toUpperCase();
    const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
    const ip = getClientIp(event);
    const userAgent = event.headers['user-agent'] || null;

    const checked = verifyReceiptToken(receiptToken);
    if (!checked.ok) {
      await saveAudit({
        ...resolveAuditActor(actor, null, 'public'),
        action: 'verification.check_failed',
        target_type: 'receipt_token',
        target_id: credentialId || productId || 'unknown',
        ip,
        user_agent: userAgent,
        metadata: {
          product_id: productId || null,
          credential_id: credentialId || null,
          error: checked.error
        }
      });
      return json(403, { ok: false, error: checked.error });
    }

    const receipt = checked.receipt;
    const hasProduct = !productId || (Array.isArray(receipt.items) && receipt.items.indexOf(productId) !== -1);
    const credentialMatches = !credentialId || String(receipt.credential_id || '').toUpperCase() === credentialId;
    const verified = hasProduct && credentialMatches;

    await saveAudit({
      ...resolveAuditActor(actor, receipt.email || null, 'public'),
      action: verified ? 'verification.check_passed' : 'verification.check_failed',
      target_type: 'credential',
      target_id: receipt.credential_id || receipt.purchase_id || 'unknown',
      ip,
      user_agent: userAgent,
      metadata: {
        purchase_id: receipt.purchase_id || null,
        product_id: productId || null,
        credential_id: credentialId || receipt.credential_id || null,
        checks: {
          product: hasProduct,
          credential: credentialMatches
        }
      }
    });

    return json(200, {
      ok: verified,
      verified,
      receipt: {
        purchase_id: receipt.purchase_id,
        issued_at: receipt.issued_at,
        items: receipt.items || [],
        credential_id: receipt.credential_id || null
      },
      checks: {
        product: hasProduct,
        credential: credentialMatches
      }
    });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
