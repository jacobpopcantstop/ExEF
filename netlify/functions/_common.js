const crypto = require('crypto');

// Structured logger — outputs JSON lines compatible with Netlify log drain
const log = {
  info:  (msg, meta = {}) => console.log(JSON.stringify({ level: 'info',  msg, ...meta, ts: new Date().toISOString() })),
  warn:  (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn',  msg, ...meta, ts: new Date().toISOString() })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: new Date().toISOString() })),
};

const ASSET_MAP = {
  'gap-analyzer': 'docs/assets/executive-function-skills-gap-analyzer.pdf',
  'launch-plan': 'docs/assets/90-day-coaching-business-launch-plan.pdf'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': requiredEnv('EFI_CORS_ORIGIN') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-EFI-Admin-Key'
    },
    body: JSON.stringify(body)
  };
}

async function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return null;
  }
}

function baseUrl(event) {
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(payload, signature, secret) {
  const expected = signPayload(payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature || ''), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function requiredEnv(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

const MAILERLITE_GROUPS = {
  enrollment_notification: '182389542082315956',
  purchase_intent:         '182389527047833032',
};

async function syncToMailerLite(email, name, groupKey) {
  const apiKey = requiredEnv('EFI_MAILERLITE_API_KEY');
  if (!apiKey) return { ok: false, error: 'EFI_MAILERLITE_API_KEY not set' };

  const groupId = MAILERLITE_GROUPS[groupKey] || MAILERLITE_GROUPS.purchase_intent;

  try {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email,
        fields: { name },
        groups: [groupId]
      })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, group: groupKey, subscriber_id: data?.data?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function fanout(payload) {
  const targets = [
    requiredEnv('EFI_CRM_WEBHOOK_URL'),
    requiredEnv('EFI_ESP_WEBHOOK_URL')
  ].filter(Boolean);

  if (!targets.length) {
    console.log('[EFI_LEAD_FALLOUT]', JSON.stringify(payload));
    return { delivered: false, targets: 0 };
  }

  const results = await Promise.all(targets.map(async (url) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { url, ok: res.ok, status: res.status };
    } catch (err) {
      return { url, ok: false, status: 0, error: err.message };
    }
  }));

  return { delivered: results.some((r) => r.ok), targets: targets.length, results };
}

module.exports = {
  log,
  ASSET_MAP,
  json,
  parseBody,
  baseUrl,
  signPayload,
  verifySignature,
  normalizeEmail,
  requiredEnv,
  fanout,
  syncToMailerLite
};
