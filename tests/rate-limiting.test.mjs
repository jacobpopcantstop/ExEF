import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../netlify/functions/_db.js');

// Helper: unique key per test to avoid cross-test state pollution
let keyCounter = 0;
function uniqueKey(prefix = 'rl-test') {
  return `${prefix}-${++keyCounter}-${Date.now()}`;
}

test('consumeRateLimit first call is allowed', async () => {
  const key = uniqueKey();
  const result = await db.consumeRateLimit(key, 1000, 5);
  assert.equal(result.allowed, true);
  assert.equal(result.count, 1);
  assert.equal(result.max, 5);
});

test('consumeRateLimit calls up to the limit are all allowed', async () => {
  const key = uniqueKey();
  const limit = 3;
  for (let i = 1; i <= limit; i++) {
    const result = await db.consumeRateLimit(key, 1000, limit);
    assert.equal(result.allowed, true, `call ${i} should be allowed`);
    assert.equal(result.count, i);
  }
});

test('consumeRateLimit the (limit+1)th call within the window is rejected', async () => {
  const key = uniqueKey();
  const limit = 3;
  // exhaust the limit
  for (let i = 0; i < limit; i++) {
    await db.consumeRateLimit(key, 1000, limit);
  }
  // next call should be rejected
  const result = await db.consumeRateLimit(key, 1000, limit);
  assert.equal(result.allowed, false);
  assert.equal(result.count, limit);
  assert.equal(result.max, limit);
});

test('consumeRateLimit rejects all further calls once limit is exceeded', async () => {
  const key = uniqueKey();
  const limit = 2;
  for (let i = 0; i < limit; i++) {
    await db.consumeRateLimit(key, 1000, limit);
  }
  // call it several more times — all should be rejected
  for (let extra = 0; extra < 3; extra++) {
    const result = await db.consumeRateLimit(key, 1000, limit);
    assert.equal(result.allowed, false, `extra call ${extra + 1} should be rejected`);
  }
});

test('consumeRateLimit counter resets after the window expires', async () => {
  const key = uniqueKey();
  const windowMs = 50; // very short window
  const limit = 2;

  // exhaust the limit
  for (let i = 0; i < limit; i++) {
    await db.consumeRateLimit(key, windowMs, limit);
  }

  // confirm we are now rate-limited
  const blocked = await db.consumeRateLimit(key, windowMs, limit);
  assert.equal(blocked.allowed, false);

  // wait for the window to expire
  await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

  // counter should have reset — first call in new window is allowed
  const reset = await db.consumeRateLimit(key, windowMs, limit);
  assert.equal(reset.allowed, true);
  assert.equal(reset.count, 1);
});

test('consumeRateLimit uses separate buckets for different keys', async () => {
  const keyA = uniqueKey('a');
  const keyB = uniqueKey('b');
  const limit = 1;

  // exhaust keyA
  await db.consumeRateLimit(keyA, 1000, limit);
  const blockedA = await db.consumeRateLimit(keyA, 1000, limit);
  assert.equal(blockedA.allowed, false);

  // keyB should still be fresh
  const freshB = await db.consumeRateLimit(keyB, 1000, limit);
  assert.equal(freshB.allowed, true);
});

test('consumeRateLimit with limit of 1 allows exactly one call then blocks', async () => {
  const key = uniqueKey();
  const first = await db.consumeRateLimit(key, 1000, 1);
  assert.equal(first.allowed, true);
  assert.equal(first.count, 1);

  const second = await db.consumeRateLimit(key, 1000, 1);
  assert.equal(second.allowed, false);
});
