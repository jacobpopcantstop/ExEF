const { json, parseBody, requiredEnv } = require('./_common');
const { getActor, isPrivilegedRole } = require('./_authz');
const db = require('./_db');

function hasManagedAuth() {
  return !!(requiredEnv('SUPABASE_URL') && requiredEnv('SUPABASE_ANON_KEY'));
}

async function authorizeEmail(event, email) {
  if (!hasManagedAuth()) return { ok: true, actor: { role: 'guest', email: null } };
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  if (!actor || !actor.email) {
    return { ok: false, statusCode: 401, error: 'Managed authentication required', actor };
  }
  const normalizedActor = String(actor.email || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!isPrivilegedRole(actor.role) && normalizedActor !== normalizedEmail) {
    return { ok: false, statusCode: 403, error: 'You may only access your own progress record', actor };
  }
  return { ok: true, actor };
}

exports.handler = async function (event) {
  const method = event.httpMethod;

  if (method === 'GET') {
    const email = String((event.queryStringParameters || {}).email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email query parameter is required' });
    const authz = await authorizeEmail(event, email);
    if (!authz.ok) return json(authz.statusCode, { ok: false, error: authz.error });
    const record = await db.getProgress(email);
    return json(200, { ok: true, found: record.found, progress: record.progress, updated_at: record.updated_at, storage: record.storage });
  }

  if (method === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

    const email = String(body.email || '').trim().toLowerCase();
    const progress = body.progress && typeof body.progress === 'object' ? body.progress : null;
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
    if (!progress) return json(400, { ok: false, error: 'progress object is required' });
    const authz = await authorizeEmail(event, email);
    if (!authz.ok) return json(authz.statusCode, { ok: false, error: authz.error });

    const result = await db.upsertProgress(email, progress);
    return json(200, { ok: true, updated_at: result.updated_at, storage: result.storage });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
