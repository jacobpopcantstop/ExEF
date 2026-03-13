import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../netlify/functions/_db.js');
const coachDirectory = require('../netlify/functions/coach-directory.js');
const submissions = require('../netlify/functions/submissions.js');
const verify = require('../netlify/functions/verify.js');

async function getCsrf(adminKey) {
  const res = await coachDirectory.handler({
    httpMethod: 'GET',
    headers: { 'x-efi-admin-key': adminKey },
    queryStringParameters: { action: 'csrf' }
  });
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  return body.csrf;
}

test('review_submission allows privileged override and immediate release', async () => {
  const originalKey = process.env.EFI_ADMIN_API_KEY;
  process.env.EFI_ADMIN_API_KEY = 'test-admin-key';
  const submissionId = 'sub_review_' + Date.now().toString(36);

  try {
    await db.createSubmission({
      id: submissionId,
      email: 'reviewer-target@example.com',
      kind: 'module',
      module_id: '2',
      evidence_url: 'https://example.com/work',
      notes: 'Initial submission',
      status: 'feedback_ready',
      score: 68,
      feedback: { score: 68 },
      submitted_at: new Date().toISOString(),
      release_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      notified_at: null
    });

    const csrf = await getCsrf('test-admin-key');
    const res = await submissions.handler({
      httpMethod: 'POST',
      headers: {
        'x-efi-admin-key': 'test-admin-key',
        'x-efi-csrf': csrf,
        'user-agent': 'reviewer-actions-test'
      },
      body: JSON.stringify({
        action: 'review_submission',
        submission_id: submissionId,
        decision: 'override_pass',
        reviewer_notes: 'Manual pass after reviewer calibration check.',
        score: 84,
        release_now: true
      })
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.decision, 'override_pass');
    assert.equal(body.submission.score, 84);
    assert.equal(body.submission.feedback_available, true);

    const updated = await db.getSubmission(submissionId);
    assert.equal(updated.found, true);
    assert.equal(updated.submission.score, 84);
    assert.equal(updated.submission.status, 'feedback_ready');
    assert.ok(updated.submission.notified_at);
  } finally {
    process.env.EFI_ADMIN_API_KEY = originalKey;
  }
});

test('review_certificate records privileged decision against certificate purchase', async () => {
  const originalKey = process.env.EFI_ADMIN_API_KEY;
  process.env.EFI_ADMIN_API_KEY = 'test-admin-key';
  const email = 'cert-review@example.com';
  const credentialId = 'EFI-CEFC-REVIEW1';

  try {
    await db.addPurchase(email, {
      id: 'ord_review_' + Date.now().toString(36),
      date: new Date().toISOString(),
      total: 350,
      items: [{ id: 'certificate', name: 'Certificate', price: 350 }],
      receipt: 'signed-token-placeholder',
      credentialId
    });

    const csrf = await getCsrf('test-admin-key');
    const res = await verify.handler({
      httpMethod: 'POST',
      headers: {
        'x-efi-admin-key': 'test-admin-key',
        'x-efi-csrf': csrf,
        'user-agent': 'reviewer-actions-test'
      },
      body: JSON.stringify({
        action: 'review_certificate',
        email,
        credential_id: credentialId,
        decision: 'hold',
        reviewer_notes: 'Holding release pending final scope review.'
      })
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.decision, 'hold');
    assert.equal(body.credential_id, credentialId);
    assert.equal(body.purchase.reviewerDecision, 'hold');
    assert.equal(body.purchase.reviewedBy, 'admin');

    const logs = await db.listAuditLogs({ targetType: 'credential', targetId: credentialId, limit: 10 });
    assert.ok((logs.logs || []).some((log) => log.action === 'certificate.reviewer_decision'));
  } finally {
    process.env.EFI_ADMIN_API_KEY = originalKey;
  }
});

test('review_queue lists privileged submissions with learner email', async () => {
  const originalKey = process.env.EFI_ADMIN_API_KEY;
  process.env.EFI_ADMIN_API_KEY = 'test-admin-key';
  const submissionId = 'sub_queue_' + Date.now().toString(36);

  try {
    await db.createSubmission({
      id: submissionId,
      email: 'queue-target@example.com',
      kind: 'capstone',
      module_id: null,
      evidence_url: 'https://example.com/capstone',
      notes: 'Queue listing test',
      status: 'feedback_ready',
      score: 82,
      feedback: { score: 82 },
      submitted_at: new Date().toISOString(),
      release_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      notified_at: null
    });

    const res = await submissions.handler({
      httpMethod: 'GET',
      headers: { 'x-efi-admin-key': 'test-admin-key' },
      queryStringParameters: {
        review_queue: '1',
        kind: 'capstone',
        email: 'queue-target@example.com',
        limit: '10'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.submissions.length, 1);
    assert.equal(body.submissions[0].id, submissionId);
    assert.equal(body.submissions[0].email, 'queue-target@example.com');
    assert.equal(body.submissions[0].kind, 'capstone');
  } finally {
    process.env.EFI_ADMIN_API_KEY = originalKey;
  }
});

test('certificate review queue lists privileged certificate purchases', async () => {
  const originalKey = process.env.EFI_ADMIN_API_KEY;
  process.env.EFI_ADMIN_API_KEY = 'test-admin-key';
  const email = 'cert-queue@example.com';
  const credentialId = 'EFI-CEFC-QUEUE1';

  try {
    await db.addPurchase(email, {
      id: 'ord_cert_queue_' + Date.now().toString(36),
      date: new Date().toISOString(),
      total: 350,
      items: [{ id: 'certificate', name: 'Certificate', price: 350 }],
      receipt: 'signed-token-placeholder',
      credentialId
    });

    const res = await verify.handler({
      httpMethod: 'GET',
      headers: { 'x-efi-admin-key': 'test-admin-key' },
      queryStringParameters: {
        review_queue: '1',
        email,
        limit: '10'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.purchases.length, 1);
    assert.equal(body.purchases[0].email, email);
    assert.equal(body.purchases[0].credentialId, credentialId);
    assert.equal(body.purchases[0].hasCertificate, true);
    assert.equal(body.purchases[0].reviewerDecision, null);
  } finally {
    process.env.EFI_ADMIN_API_KEY = originalKey;
  }
});
