import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authScriptPath = path.resolve(__dirname, '../js/auth.js');

function createStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

function loadAuthWithUser(user) {
  const storage = createStorage({
    efi_users: JSON.stringify({ [user.email]: user }),
    efi_session: JSON.stringify({
      email: user.email,
      name: user.name,
      mode: 'prototype',
      role: user.role || 'learner',
      createdAt: user.createdAt || '2026-03-09T00:00:00.000Z',
      progress: user.progress,
      purchases: user.purchases || [],
      loggedInAt: '2026-03-09T00:00:00.000Z'
    })
  });

  const context = {
    console,
    Promise,
    setTimeout,
    clearTimeout,
    TextEncoder,
    localStorage: storage,
    fetch: () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true })
    }),
    document: {
      addEventListener() {},
      querySelectorAll() { return []; }
    },
    window: {
      EFI: {},
      fetch: null,
      crypto: null,
      location: { href: '', pathname: '/dashboard.html' },
      document: null
    },
    btoa: (input) => Buffer.from(input, 'binary').toString('base64'),
    atob: (input) => Buffer.from(input, 'base64').toString('binary')
  };

  context.window.fetch = context.fetch;
  context.window.document = context.document;
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(authScriptPath, 'utf8'),
    context
  );

  return { auth: context.window.EFI.Auth, storage };
}

test('recordModuleAssessment saves score and marks module passed', async () => {
  const user = {
    email: 'learner@example.com',
    name: 'Learner',
    role: 'learner',
    progress: {
      modules: {},
      moduleAssessments: {},
      submissions: {},
      esqrCompleted: false,
      capstone: { status: 'not_submitted' }
    },
    purchases: []
  };

  const { auth, storage } = loadAuthWithUser(user);
  const result = auth.recordModuleAssessment('module-2', {
    score: 83,
    correct: 5,
    total: 6,
    passed: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.assessment.score, 83);
  assert.equal(result.assessment.passed, true);

  const savedUsers = JSON.parse(storage.getItem('efi_users'));
  assert.equal(savedUsers['learner@example.com'].progress.modules['2'], true);
  assert.equal(savedUsers['learner@example.com'].progress.moduleAssessments['2'].correct, 5);
});

test('getCertificationStatus counts passed module assessments toward readiness', async () => {
  const assessments = {};
  ['1', '2', '3', '4', '5', '6'].forEach((id) => {
    assessments[id] = {
      moduleId: id,
      score: 90,
      correct: 9,
      total: 10,
      passed: true,
      completedAt: '2026-03-09T00:00:00.000Z'
    };
  });

  const user = {
    email: 'coach@example.com',
    name: 'Coach',
    role: 'learner',
    progress: {
      modules: {},
      moduleAssessments: assessments,
      submissions: {},
      esqrCompleted: false,
      capstone: { status: 'passed' }
    },
    purchases: []
  };

  const { auth } = loadAuthWithUser(user);
  const status = auth.getCertificationStatus(auth.getCurrentUser());

  assert.equal(status.modulesCompleted, 6);
  assert.equal(status.allModulesCompleted, true);
  assert.equal(status.eligibleForCertificate, true);
});

test('failed module assessment does not count as completed', async () => {
  const user = {
    email: 'retry@example.com',
    name: 'Retry Learner',
    role: 'learner',
    progress: {
      modules: {},
      moduleAssessments: {
        '3': {
          moduleId: '3',
          score: 60,
          correct: 3,
          total: 5,
          passed: false,
          completedAt: '2026-03-09T00:00:00.000Z'
        }
      },
      submissions: {},
      esqrCompleted: false,
      capstone: { status: 'not_submitted' }
    },
    purchases: []
  };

  const { auth } = loadAuthWithUser(user);
  assert.equal(auth.isModuleComplete('3', auth.getCurrentUser().progress), false);
});

test('getReleaseMetrics summarizes pending releases and average score', async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const laterFuture = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const user = {
    email: 'metrics@example.com',
    name: 'Metrics Learner',
    role: 'learner',
    progress: {
      modules: { '1': true },
      moduleAssessments: {
        '1': {
          moduleId: '1',
          score: 88,
          correct: 8,
          total: 10,
          passed: true,
          completedAt: '2026-03-09T00:00:00.000Z'
        }
      },
      submissions: {
        '1': {
          status: 'feedback_ready',
          score: 88,
          releaseAt: future
        },
        '2': {
          status: 'feedback_ready',
          score: 92,
          releaseAt: laterFuture
        }
      },
      esqrCompleted: false,
      capstone: {
        status: 'feedback_pending_release',
        releaseAt: laterFuture
      }
    },
    purchases: []
  };

  const { auth } = loadAuthWithUser(user);
  const metrics = auth.getReleaseMetrics(auth.getCurrentUser().progress);

  assert.equal(metrics.pendingReleaseCount, 3);
  assert.equal(metrics.averageScore, 90);
  assert.equal(metrics.nextReleaseAt, future);
});

test('syncLearningLoopState merges local learning-loop records into persisted progress', async () => {
  const user = {
    email: 'loop@example.com',
    name: 'Loop Learner',
    role: 'learner',
    progress: {
      modules: {},
      moduleAssessments: {},
      submissions: {},
      esqrCompleted: false,
      capstone: { status: 'not_submitted' },
      learningLoop: {
        actionPlans: [
          {
            plan_id: 'remote-plan',
            state: { created_at: '2026-03-09T00:00:00.000Z' }
          }
        ],
        reflections: [],
        adherence: { sessions: [] }
      }
    },
    purchases: []
  };

  const { auth, storage } = loadAuthWithUser(user);
  storage.setItem('efi_action_plans_v1', JSON.stringify([
    {
      plan_id: 'local-plan',
      state: { created_at: '2026-03-10T00:00:00.000Z' }
    }
  ]));
  storage.setItem('efi_reflections_v1', JSON.stringify([
    {
      id: 'reflection-1',
      at: '2026-03-10T01:00:00.000Z',
      reflection_48h: 'Test one transfer behavior.'
    }
  ]));
  storage.setItem('efi_adherence_v1', JSON.stringify({
    sessions: [
      { at: '2026-03-10T02:00:00.000Z', moduleId: 'module-1', completed: true }
    ]
  }));

  assert.equal(auth.syncLearningLoopState(), true);

  const session = JSON.parse(storage.getItem('efi_session'));
  assert.equal(session.progress.learningLoop.actionPlans.length, 2);
  assert.equal(session.progress.learningLoop.reflections.length, 1);
  assert.equal(session.progress.learningLoop.adherence.sessions.length, 1);
  assert.equal(session.progress.learningLoop.adherence.computed.level, 'high');

  const savedUsers = JSON.parse(storage.getItem('efi_users'));
  assert.equal(savedUsers['loop@example.com'].progress.learningLoop.actionPlans.length, 2);
});
