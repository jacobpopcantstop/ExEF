const crypto = require('crypto');
const { json, parseBody, fanout, requiredEnv, log } = require('./_common');
const { getActor } = require('./_authz');
const db = require('./_db');
const ai = require('./_ai_rubric');

function cronSecretMatches(input) {
  const expected = String(process.env.EFI_SUBMISSIONS_CRON_SECRET || '').trim();
  if (!expected) return true;
  return String(input || '').trim() === expected;
}

function releaseAt24h() {
  return new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();
}

function visibleSubmission(row, nowIso) {
  const releaseAt = row.release_at || null;
  const isReleased = !releaseAt || releaseAt <= nowIso;
  return {
    id: row.id,
    kind: row.kind,
    module_id: row.module_id,
    evidence_url: row.evidence_url,
    notes: row.notes,
    status: row.status,
    submitted_at: row.submitted_at,
    release_at: releaseAt,
    feedback_available: isReleased,
    score: isReleased ? row.score : null,
    feedback: isReleased ? row.feedback : null
  };
}

function getClientIp(event) {
  const forwarded = String((event.headers && event.headers['x-forwarded-for']) || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return String((event.headers && (event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'])) || '').trim() || null;
}

function resolveAuditActor(actor, email) {
  return {
    actor_role: (actor && actor.role && actor.role !== 'guest') ? actor.role : 'learner',
    actor_email: (actor && actor.email) || email || null
  };
}

async function saveAudit(entry) {
  return db.saveAuditLog(entry).catch(() => null);
}

function csrfSecret() {
  return requiredEnv('EFI_CSRF_SIGNING_SECRET') || 'efi-dev-csrf-secret';
}

function signCsrfPayload(raw) {
  return crypto.createHmac('sha256', csrfSecret()).update(raw).digest('hex');
}

function decodeBase64Url(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function verifyCsrfToken(token, actor) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return false;
  const encoded = parts[0];
  const providedSig = parts[1];
  const expectedSig = signCsrfPayload(encoded);
  if (providedSig !== expectedSig) return false;

  let payload = null;
  try {
    payload = JSON.parse(decodeBase64Url(encoded));
  } catch (err) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || !payload.exp || payload.exp < now) return false;
  if (String(payload.role || '') !== String(actor.role || '')) return false;
  if (payload.email && actor.email && String(payload.email).toLowerCase() !== String(actor.email).toLowerCase()) return false;
  return true;
}

function isPrivilegedRole(role) {
  return role === 'admin' || role === 'reviewer';
}

async function notifyRelease(row, reason) {
  if (!row || row.notified_at) return;
  await fanout({
    type: 'feedback_ready',
    email: row.email,
    submission_id: row.id,
    kind: row.kind,
    module_id: row.module_id,
    score: row.score,
    release_at: row.release_at,
    release_reason: reason || 'manual_review'
  });
  await db.updateSubmission(row.id, { notified_at: new Date().toISOString() });
}

async function submit(body, event) {
  const email = String(body.email || '').trim().toLowerCase();
  const kind = String(body.kind || 'module');
  const moduleId = body.module_id ? String(body.module_id) : null;
  const evidenceUrl = String(body.evidence_url || '').trim();
  const notes = String(body.notes || '').trim();
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  const ip = getClientIp(event);
  const userAgent = event.headers['user-agent'] || null;

  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!evidenceUrl) return json(400, { ok: false, error: 'evidence_url is required' });
  if (evidenceUrl.length > 2048) return json(400, { ok: false, error: 'evidence_url exceeds maximum length' });
  if (!/^https?:\/\//i.test(evidenceUrl)) return json(400, { ok: false, error: 'evidence_url must be a valid HTTP(S) URL' });
  if (notes.length > 5000) return json(400, { ok: false, error: 'notes exceeds maximum length' });
  if (!['module', 'capstone'].includes(kind)) return json(400, { ok: false, error: 'kind must be module or capstone' });
  if (kind === 'module' && !moduleId) return json(400, { ok: false, error: 'module_id is required for module submissions' });
  if (kind === 'module' && !['1','2','3','4','5','6'].includes(moduleId)) return json(400, { ok: false, error: 'module_id must be 1-6' });

  log.info('submission received', { action: kind === 'capstone' ? 'submit_capstone' : 'submit_module', email, kind });
  const graded = await ai.gradeSubmission({
    kind,
    module_id: moduleId,
    evidence_url: evidenceUrl,
    notes
  });

  log.info('grading complete', { email, score: graded.score, passed: graded.passed });
  const submissionRow = await db.createSubmission({
    email,
    kind,
    module_id: moduleId,
    evidence_url: evidenceUrl,
    notes,
    status: 'feedback_ready',
    score: graded.score,
    feedback: graded,
    submitted_at: new Date().toISOString(),
    release_at: releaseAt24h(),
    notified_at: null
  });

  await db.upsertProgress(email, {
    modules: {},
    submissions: {},
    capstone: { status: kind === 'capstone' ? 'submitted' : 'not_submitted' },
    esqrCompleted: false
  }).catch((err) => {
    log.error('upsertProgress failed', { email, error: err && err.message });
  });

  await saveAudit({
    ...resolveAuditActor(actor, email),
    action: kind === 'capstone' ? 'submission.capstone_submitted' : 'submission.module_submitted',
    target_type: 'submission',
    target_id: submissionRow.submission.id,
    ip,
    user_agent: userAgent,
    metadata: {
      email,
      kind,
      module_id: moduleId,
      status: submissionRow.submission.status,
      score: submissionRow.submission.score,
      release_at: submissionRow.submission.release_at
    }
  });

  return json(200, {
    ok: true,
    submission_id: submissionRow.submission.id,
    release_at: submissionRow.submission.release_at,
    status: 'queued_for_release',
    message: 'Submission reviewed by rubric engine. Feedback unlocks after 24 hours.'
  });
}

async function listForUser(email) {
  const now = new Date().toISOString();
  const rows = await db.listSubmissions(email);
  return json(200, {
    ok: true,
    storage: rows.storage,
    submissions: (rows.submissions || []).map((r) => visibleSubmission(r, now))
  });
}

async function listForReview(query, event) {
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });

  const now = new Date().toISOString();
  const rows = await db.listAllSubmissions({
    kind: query.kind || '',
    status: query.status || '',
    email: query.email || '',
    limit: query.limit || '100'
  });

  const records = (rows.submissions || []).map((row) => {
    const visible = visibleSubmission(row, now);
    visible.email = row.email || null;
    visible.notified_at = row.notified_at || null;
    return visible;
  });

  return json(200, {
    ok: true,
    storage: rows.storage,
    count: records.length,
    submissions: records
  });
}

async function processDueFeedback() {
  const due = await db.getDueFeedback(new Date().toISOString());
  let notified = 0;

  for (const row of (due.submissions || [])) {
    await fanout({
      type: 'feedback_ready',
      email: row.email,
      submission_id: row.id,
      kind: row.kind,
      module_id: row.module_id,
      score: row.score,
      release_at: row.release_at
    });
    log.info('feedback released', { submissionId: row.id, email: row.email });
    await db.updateSubmission(row.id, { notified_at: new Date().toISOString() });
    await saveAudit({
      actor_role: 'system',
      actor_email: null,
      action: 'submission.feedback_released',
      target_type: 'submission',
      target_id: row.id,
      metadata: {
        email: row.email || null,
        kind: row.kind || null,
        module_id: row.module_id || null,
        score: row.score,
        release_at: row.release_at || null
      }
    });
    notified++;
  }

  return json(200, { ok: true, queued: (due.submissions || []).length, notified, storage: due.storage });
}

async function reviewSubmission(body, event) {
  const actor = await getActor(event).catch(() => ({ role: 'guest', email: null }));
  if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
  const csrfToken = event.headers['x-efi-csrf'] || event.headers['X-EFI-CSRF'] || '';
  if (!verifyCsrfToken(csrfToken, actor)) return json(403, { ok: false, error: 'CSRF validation failed' });

  const submissionId = String(body.submission_id || '').trim();
  const decision = String(body.decision || '').trim().toLowerCase();
  const reviewerNotes = String(body.reviewer_notes || '').trim();
  const releaseNow = body.release_now === true || String(body.release_now || '').trim() === '1';
  const scoreInput = body.score;

  if (!submissionId) return json(400, { ok: false, error: 'submission_id is required' });
  if (!['override_pass', 'override_fail', 'needs_revision', 'release_now'].includes(decision)) {
    return json(400, { ok: false, error: 'decision must be override_pass, override_fail, needs_revision, or release_now' });
  }
  if (reviewerNotes.length < 8) return json(400, { ok: false, error: 'reviewer_notes must explain the manual decision' });

  const found = await db.getSubmission(submissionId);
  if (!found || !found.found || !found.submission) return json(404, { ok: false, error: 'Submission not found' });

  const existing = found.submission;
  const patch = {};
  if (decision === 'override_pass') {
    const nextScore = scoreInput == null || scoreInput === '' ? Math.max(75, Number(existing.score || 75)) : Number(scoreInput);
    patch.score = Number.isFinite(nextScore) ? Math.max(75, Math.min(100, Math.round(nextScore))) : 75;
    patch.status = 'feedback_ready';
  } else if (decision === 'override_fail') {
    const nextScore = scoreInput == null || scoreInput === '' ? Math.min(74, Number(existing.score == null ? 60 : existing.score)) : Number(scoreInput);
    patch.score = Number.isFinite(nextScore) ? Math.max(0, Math.min(74, Math.round(nextScore))) : 60;
    patch.status = 'feedback_ready';
  } else if (decision === 'needs_revision') {
    patch.status = 'needs_revision';
    if (scoreInput != null && scoreInput !== '') {
      const parsedScore = Number(scoreInput);
      if (Number.isFinite(parsedScore)) patch.score = Math.max(0, Math.min(100, Math.round(parsedScore)));
    }
  }

  const feedback = Object.assign({}, existing.feedback || {});
  feedback.reviewer_override = {
    decision,
    reviewer_notes: reviewerNotes,
    actor_email: actor.email || null,
    actor_role: actor.role,
    reviewed_at: new Date().toISOString()
  };
  patch.feedback = feedback;

  if (decision === 'release_now' || releaseNow) {
    patch.release_at = new Date().toISOString();
    if (!existing.notified_at) patch.notified_at = null;
  }

  const updated = await db.updateSubmission(submissionId, patch);
  if (!updated) return json(404, { ok: false, error: 'Submission not found' });

  if ((decision === 'release_now' || releaseNow) && !updated.notified_at) {
    await notifyRelease(updated, 'manual_release');
  }

  await saveAudit({
    actor_role: actor.role,
    actor_email: actor.email || null,
    action: 'submission.reviewer_decision',
    target_type: 'submission',
    target_id: submissionId,
    ip: getClientIp(event),
    user_agent: event.headers['user-agent'] || null,
    metadata: {
      email: updated.email || null,
      kind: updated.kind || null,
      module_id: updated.module_id || null,
      decision,
      reviewer_notes: reviewerNotes,
      score: updated.score,
      status: updated.status,
      release_at: updated.release_at || null
    }
  });

  log.info('reviewer decision', { submissionId, decision, reviewer: actor.email });
  return json(200, {
    ok: true,
    submission: visibleSubmission(updated, new Date().toISOString()),
    decision,
    message: 'Reviewer decision recorded.'
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters || {};
    if (String(qs.review_queue || '').trim() === '1') {
      return listForReview(qs, event);
    }
    const email = String(qs.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email query parameter is required' });
    return listForUser(email);
  }

  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

    const action = String(body.action || '').trim();
    if (action === 'submit_module') {
      return submit({
        email: body.email,
        kind: 'module',
        module_id: body.module_id,
        evidence_url: body.evidence_url,
        notes: body.notes
      }, event);
    }
    if (action === 'submit_capstone') {
      return submit({
        email: body.email,
        kind: 'capstone',
        module_id: null,
        evidence_url: body.evidence_url,
        notes: body.notes
      }, event);
    }
    if (action === 'process_due_feedback') {
      if (!cronSecretMatches(body.secret || (event.headers['x-efi-cron-secret'] || event.headers['X-EFI-Cron-Secret']))) {
        return json(401, { ok: false, error: 'Unauthorized feedback processor invocation' });
      }
      return processDueFeedback();
    }
    if (action === 'review_submission') {
      return reviewSubmission(body, event);
    }
    return json(400, { ok: false, error: 'Unsupported action' });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
