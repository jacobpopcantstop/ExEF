const { json, requiredEnv } = require('./_common');

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  return json(200, {
    ok: true,
    stripePublicKey: requiredEnv('STRIPE_PUBLIC_KEY') || null
  });
};
