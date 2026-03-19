const { json, requiredEnv } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const sessionId = (event.queryStringParameters || {}).session_id;
  if (!sessionId) return json(400, { ok: false, error: 'session_id required' });

  const secretKey = requiredEnv('STRIPE_SECRET_KEY');
  if (!secretKey) return json(503, { ok: false, error: 'Stripe not configured' });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });

    if (res.status === 404) return json(404, { ok: false, error: 'Session not found' });

    const data = await res.json();

    if (!res.ok) {
      return json(502, { ok: false, error: data.error?.message || 'Stripe lookup failed' });
    }

    return json(200, {
      ok: true,
      status: data.status,
      customer_email: data.customer_details?.email || data.customer_email || null,
      offer_label: (data.metadata && data.metadata.offer_label) || null,
      dashboard_url: '/dashboard.html'
    });
  } catch (err) {
    return json(502, { ok: false, error: 'Failed to reach Stripe' });
  }
};
