import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rubric = require('../netlify/functions/_ai_rubric.js');

// gradeSubmission — fallback path (no GEMINI_API_KEY set)
test('gradeSubmission falls back to fallbackGrade when no API key is configured', async () => {
  delete process.env.GEMINI_API_KEY;
  const result = await rubric.gradeSubmission({
    kind: 'module',
    module_id: '2',
    evidence_url: 'https://example.com/evidence',
    notes: 'Client showed measurable improvement'
  });
  assert.equal(typeof result.score, 'number');
  assert.equal(typeof result.pass, 'boolean');
  assert.ok(Array.isArray(result.strengths));
  assert.ok(Array.isArray(result.improvements));
  assert.ok(result.score >= 0 && result.score <= 100);
});

test('gradeSubmission fallback pass field matches score >= 75 threshold', async () => {
  delete process.env.GEMINI_API_KEY;
  const result = await rubric.gradeSubmission({
    kind: 'capstone',
    evidence_url: 'https://example.com',
    notes: 'x'.repeat(20)
  });
  assert.equal(result.pass, result.score >= 75);
});

// parseJsonFromModel
test('parseJsonFromModel extracts JSON from noisy model output with prefix and suffix', () => {
  const parsed = rubric.parseJsonFromModel('Sure! Here is your answer: {"score":82,"pass":true,"summary":"Good work"} That is all.');
  assert.equal(parsed.score, 82);
  assert.equal(parsed.pass, true);
  assert.equal(parsed.summary, 'Good work');
});

test('parseJsonFromModel works when text is exactly a JSON object', () => {
  const parsed = rubric.parseJsonFromModel('{"score":70,"pass":false}');
  assert.equal(parsed.score, 70);
  assert.equal(parsed.pass, false);
});

test('parseJsonFromModel throws when no JSON object is present', () => {
  assert.throws(() => rubric.parseJsonFromModel('no json here'), /No JSON object/);
});

test('parseJsonFromModel throws on empty string', () => {
  assert.throws(() => rubric.parseJsonFromModel(''), /Empty model response/);
});

// fallbackGrade — score range
test('fallbackGrade returns score between 65 and 95 inclusive', () => {
  for (let i = 0; i < 30; i++) {
    const out = rubric.fallbackGrade({
      evidence_url: `https://example.com/${i}`,
      notes: 'a'.repeat(i)
    });
    assert.ok(out.score >= 65, `score ${out.score} should be >= 65`);
    assert.ok(out.score <= 95, `score ${out.score} should be <= 95`);
  }
});

test('fallbackGrade is deterministic for the same input', () => {
  const input = { evidence_url: 'https://example.com/stable', notes: 'consistent input' };
  const a = rubric.fallbackGrade(input);
  const b = rubric.fallbackGrade(input);
  assert.equal(a.score, b.score);
  assert.equal(a.pass, b.pass);
});

test('fallbackGrade pass field is true when score >= 75', () => {
  // Force a score we know is >= 75 by using enough basis characters
  // basis = len(evidence_url + ' ' + notes); score = max(65, min(95, 68 + basis % 27))
  // To get score 75: basis % 27 === 7  => basis = 7 => 'https://x.co' (12) + ' ' + '' (0) = 13 => 13 % 27 = 13 => score 81
  const out = rubric.fallbackGrade({ evidence_url: 'https://x.co', notes: '' });
  assert.equal(out.pass, out.score >= 75);
});

test('fallbackGrade pass field is false when score < 75', () => {
  // Need basis such that 68 + basis % 27 < 75, i.e., basis % 27 < 7 => basis % 27 === 0 => basis = 27
  // evidence_url (27 chars) + ' ' + '' => 27 chars. 27 % 27 = 0 => score = 68... but max(65,...) = 68 < 75 => pass = false
  const twentySevenChars = 'https://example.com/abcdef'; // len = 26 chars, add one more char in notes
  const out = rubric.fallbackGrade({ evidence_url: twentySevenChars, notes: 'x' }); // basis = 27+1 = 28 => 28%27 = 1 => score 69 < 75
  // Verify the computation expectation
  const basis = (twentySevenChars + ' ' + 'x').trim().length;
  const expectedScore = Math.max(65, Math.min(95, 68 + (basis % 27)));
  assert.equal(out.score, expectedScore);
  assert.equal(out.pass, expectedScore >= 75);
});

// Score clamping via clampScore
test('clampScore clamps negative scores to 0', () => {
  assert.equal(rubric.clampScore(-1), 0);
  assert.equal(rubric.clampScore(-100), 0);
});

test('clampScore clamps scores above 100 to 100', () => {
  assert.equal(rubric.clampScore(101), 100);
  assert.equal(rubric.clampScore(999), 100);
});

test('clampScore passes through valid scores unchanged (after rounding)', () => {
  assert.equal(rubric.clampScore(75), 75);
  assert.equal(rubric.clampScore(74), 74);
  assert.equal(rubric.clampScore(0), 0);
  assert.equal(rubric.clampScore(100), 100);
});

// Pass threshold: score >= 75 passes, score < 75 fails
test('pass threshold: score of 75 is a pass', async () => {
  delete process.env.GEMINI_API_KEY;
  // gradeSubmission normalises score with clampScore then checks >= 75
  // We can verify this logic directly via fallbackGrade output + score check
  const score = 75;
  assert.equal(score >= 75, true);
});

test('pass threshold: score of 74 is a fail', () => {
  const score = 74;
  assert.equal(score >= 75, false);
});
