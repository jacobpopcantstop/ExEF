const { json, requiredEnv, log } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const sessionId = (event.queryStringParameters || {}).session_id;
  if (!sessionId) return json(400, { ok: false, error: 'session_id required' });

  if (!/^cs_[a-zA-Z0-9_]{6,200}$/.test(sessionId)) {
    return json(400, { ok: false, error: 'Invalid session_id format' });
  }

  const secretKey = requiredEnv('STRIPE_SECRET_KEY');
  if (!secretKey) return json(503, { ok: false, error: 'Stripe not configured' });

  log.info('get-checkout-session', { session_id_prefix: sessionId.slice(0, 20) });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });

    if (res.status === 404) return json(404, { ok: false, error: 'Session not found' });

    const data = await res.json();

    if (!res.ok) {
      log.error('stripe session lookup failed', { status: res.status, error: data.error?.code || data.error?.message });
      return json(502, { ok: false, error: data.error?.message || 'Stripe lookup failed' });
    }

    return json(200, {
      ok: true,
      status: data.status,
      customer_email: data.customer_details?.email || data.customer_email || null,
      offer_label: data.metadata?.offer_label || null,
      dashboard_url: '/dashboard.html'
    });
  } catch (err) {
    return json(502, { ok: false, error: 'Failed to reach Stripe' });
  }
};
