const { json, parseBody, normalizeEmail, requiredEnv } = require('./_common');

const OFFER_CONFIG = {
  cefc_bundle: {
    code: 'cefc_bundle',
    env: 'EFI_STRIPE_PAYMENT_LINK_CEFC_BUNDLE',
    fallbackPrice: '$895'
  },
  cefc_enrollment: {
    code: 'cefc_enrollment',
    env: 'EFI_STRIPE_PAYMENT_LINK_CEFC_ENROLLMENT',
    fallbackPrice: '$695'
  },
  capstone_review: {
    code: 'capstone_review',
    env: 'EFI_STRIPE_PAYMENT_LINK_CAPSTONE_REVIEW',
    fallbackPrice: '$350'
  },
  esqr_analysis: {
    code: 'esqr_analysis',
    env: 'EFI_STRIPE_PAYMENT_LINK_ESQR_ANALYSIS',
    fallbackPrice: '$149'
  }
};

function withPrefill(url, email) {
  if (!email) return url;
  const hasQuery = url.includes('?');
  const join = hasQuery ? '&' : '?';
  return `${url}${join}prefilled_email=${encodeURIComponent(email)}`;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const offer = String(body.offer || '').trim();
  const entry = OFFER_CONFIG[offer];
  if (!entry) return json(400, { ok: false, error: 'Unsupported offer' });

  const email = normalizeEmail(body.email);
  const paymentLink = requiredEnv(entry.env);
  if (!paymentLink) {
    return json(503, {
      ok: false,
      error: 'Direct checkout is not configured for this offer yet',
      offer: entry.code,
      expected_price: entry.fallbackPrice
    });
  }

  return json(200, {
    ok: true,
    offer: entry.code,
    checkout_url: withPrefill(paymentLink, email)
  });
};
