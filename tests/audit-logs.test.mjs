import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../netlify/functions/_db.js');
const auditLogs = require('../netlify/functions/audit-logs.js');

test('audit-logs endpoint requires privileged access', async () => {
  const originalKey = process.env.EFI_ADMIN_API_KEY;
  process.env.EFI_ADMIN_API_KEY = 'test-admin-key';

  try {
    const res = await auditLogs.handler({
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: {}
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, false);
  } finally {
    process.env.EFI_ADMIN_API_KEY = originalKey;
  }
});

test('audit-logs endpoint returns filtered privileged results', async () => {
  const originalKey = process.env.EFI_ADMIN_API_KEY;
  process.env.EFI_ADMIN_API_KEY = 'test-admin-key';
  const targetId = 'sub_test_audit_' + Date.now().toString(36);

  try {
    await db.saveAuditLog({
      actor_role: 'learner',
      actor_email: 'audit@example.com',
      action: 'submission.module_submitted',
      target_type: 'submission',
      target_id: targetId,
      metadata: { email: 'audit@example.com' }
    });

    const res = await auditLogs.handler({
      httpMethod: 'GET',
      headers: { 'x-efi-admin-key': 'test-admin-key' },
      queryStringParameters: {
        target_type: 'submission',
        target_id: targetId,
        limit: '5'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.actor_role, 'admin');
    assert.equal(body.logs.length, 1);
    assert.equal(body.logs[0].target_id, targetId);
    assert.equal(body.logs[0].action, 'submission.module_submitted');
  } finally {
    process.env.EFI_ADMIN_API_KEY = originalKey;
  }
});
