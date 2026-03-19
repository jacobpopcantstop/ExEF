const { json, parseBody, normalizeEmail, requiredEnv } = require('./_common');

const OFFER_CONFIG = {
  cefc_enrollment: {
    priceEnv: 'EFI_STRIPE_PRICE_CEFC_ENROLLMENT',
    label: 'CEFC Enrollment Access',
    price_display: '$695',
    includes: [
      'Six graded module assessments',
      'Written evaluator feedback',
      'Readiness tracking toward capstone eligibility'
    ]
  },
  capstone_review: {
    priceEnv: 'EFI_STRIPE_PRICE_CAPSTONE_REVIEW',
    label: 'Capstone Review & Credentialing',
    price_display: '$350',
    includes: [
      'Manual capstone evaluation against published rubric',
      'Written revision notes',
      'Credential processing on pass',
      'Resubmission included at no extra charge'
    ]
  },
  cefc_bundle: {
    priceEnv: 'EFI_STRIPE_PRICE_CEFC_BUNDLE',
    label: 'CEFC Bundle',
    price_display: '$895',
    includes: [
      'Full enrollment access',
      'Capstone review and credentialing',
      'Best value for practitioners starting from scratch'
    ]
  },
  esqr_analysis: {
    priceEnv: 'EFI_STRIPE_PRICE_ESQR_ANALYSIS',
    label: 'ESQ-R Professional Analysis',
    price_display: '$199',
    includes: [
      'Professional scoring and interpretation report',
      'Coaching application guidance',
      'Lowest-commitment entry point'
    ]
  }
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const offer = String(body.offer || '').trim();
  const email = normalizeEmail(body.email);
  const name = String(body.name || '').trim().slice(0, 200); // Stripe metadata values max 500 chars

  const entry = OFFER_CONFIG[offer];
  if (!entry) return json(400, { ok: false, error: 'Unsupported offer' });
  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email required' });

  const secretKey = requiredEnv('STRIPE_SECRET_KEY');
  if (!secretKey) return json(503, { ok: false, error: 'Stripe not configured' });

  const priceId = requiredEnv(entry.priceEnv);
  if (!priceId) return json(503, { ok: false, error: 'Price not configured for this offer' });

  const baseUrl = (requiredEnv('URL') || 'https://theexecutivefunctioninginstitute.com').replace(/\/$/, '');
  const returnUrl = `${baseUrl}/checkout-return.html?session_id={CHECKOUT_SESSION_ID}`; // {CHECKOUT_SESSION_ID} is a Stripe literal — Stripe replaces it at redirect time

  const params = new URLSearchParams({
    'mode': 'payment',
    'ui_mode': 'embedded',
    'return_url': returnUrl,
    'customer_email': email,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[offer]': offer,
    'metadata[customer_name]': name,
    'metadata[offer_label]': entry.label
  });

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await res.json();

    if (!res.ok || !data.client_secret) {
      return json(502, { ok: false, error: data.error?.message || 'Stripe session creation failed' });
    }

    return json(200, {
      ok: true,
      clientSecret: data.client_secret,
      offer_label: entry.label,
      price_display: entry.price_display,
      includes: entry.includes
    });
  } catch (err) {
    return json(502, { ok: false, error: 'Failed to reach Stripe' });
  }
};
