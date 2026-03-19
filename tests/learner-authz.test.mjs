import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../netlify/functions/_db.js');
const syncProgress = require('../netlify/functions/sync-progress.js');
const submissions = require('../netlify/functions/submissions.js');

function withManagedAuthEnv(fn) {
  const originalUrl = process.env.SUPABASE_URL;
  const originalAnon = process.env.SUPABASE_ANON_KEY;
  const originalFetch = global.fetch;

  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key-12345678901234567890';

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      process.env.SUPABASE_URL = originalUrl;
      process.env.SUPABASE_ANON_KEY = originalAnon;
      global.fetch = originalFetch;
    });
}

function setActorEmail(email, role = 'learner') {
  global.fetch = async function () {
    return {
      ok: true,
      json: async () => ({
        email,
        app_metadata: { role }
      })
    };
  };
}

test('sync-progress rejects mismatched learner GET when managed auth is enabled', async () => {
  await withManagedAuthEnv(async () => {
    setActorEmail('owner@example.com');

    const res = await syncProgress.handler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer token' },
      queryStringParameters: { email: 'other@example.com' }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, false);
  });
});

test('sync-progress allows matched learner POST when managed auth is enabled', async () => {
  await withManagedAuthEnv(async () => {
    setActorEmail('owner@example.com');

    const res = await syncProgress.handler({
      httpMethod: 'POST',
      headers: { authorization: 'Bearer token' },
      body: JSON.stringify({
        email: 'owner@example.com',
        progress: {
          modules: { '1': true },
          submissions: {},
          capstone: { status: 'not_submitted' }
        }
      })
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
  });
});

test('submissions rejects mismatched learner GET when managed auth is enabled', async () => {
  await withManagedAuthEnv(async () => {
    setActorEmail('owner@example.com');

    await db.createSubmission({
      id: 'sub_authz_' + Date.now().toString(36),
      email: 'other@example.com',
      kind: 'module',
      module_id: '1',
      evidence_url: 'https://example.com/work',
      notes: 'Should remain private',
      status: 'feedback_ready',
      score: 88,
      feedback: { score: 88 },
      submitted_at: new Date().toISOString(),
      release_at: new Date().toISOString(),
      notified_at: null
    });

    const res = await submissions.handler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer token' },
      queryStringParameters: { email: 'other@example.com' }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, false);
  });
});

test('submissions rejects mismatched learner POST when managed auth is enabled', async () => {
  await withManagedAuthEnv(async () => {
    setActorEmail('owner@example.com');

    const res = await submissions.handler({
      httpMethod: 'POST',
      headers: { authorization: 'Bearer token' },
      body: JSON.stringify({
        action: 'submit_module',
        email: 'other@example.com',
        module_id: '2',
        evidence_url: 'https://example.com/work',
        notes: 'Unauthorized submit attempt'
      })
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, false);
  });
});
