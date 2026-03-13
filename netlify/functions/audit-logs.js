const { json } = require('./_common');
const { getActor, isPrivilegedRole } = require('./_authz');
const db = require('./_db');

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const actor = await getActor(event);
  if (!isPrivilegedRole(actor.role)) {
    return json(403, { ok: false, error: 'Admin or reviewer role required' });
  }

  const qs = event.queryStringParameters || {};
  const limit = Math.max(1, Math.min(200, parseInt(String(qs.limit || '100'), 10) || 100));
  const targetType = String(qs.target_type || '').trim() || null;
  const targetId = String(qs.target_id || '').trim() || null;

  const logs = await db.listAuditLogs({
    limit,
    targetType,
    targetId
  });

  return json(200, {
    ok: true,
    actor_role: actor.role,
    storage: logs.storage,
    count: (logs.logs || []).length,
    logs: logs.logs || []
  });
};
