const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const TEST_PORT = 8899;
const TEST_ORIGIN = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess;

function waitForServer(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    function probe() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for local server at ${url}`));
          return;
        }
        setTimeout(probe, 200);
      });
    }

    probe();
  });
}

async function loadQuizData(page, moduleId) {
  return page.evaluate(async (id) => {
    const res = await fetch('/data/module-quizzes.json');
    const data = await res.json();
    const quiz = data.quizzes && data.quizzes[id];
    if (!quiz) return [];
    return quiz.questions.map(q => q.correct);
  }, moduleId);
}

async function answerAllQuestions(page, correctAnswers, useWrongAnswers) {
  for (let i = 0; i < correctAnswers.length; i++) {
    await page.waitForSelector('.module-quiz__question', { timeout: 10000 });

    const question = page.locator('.module-quiz__question').first();
    const radioCount = await question.locator('input[type="radio"]').count();

    let targetIdx;
    if (useWrongAnswers) {
      targetIdx = (correctAnswers[i] + 1) % radioCount;
    } else {
      targetIdx = correctAnswers[i];
    }

    await question.locator(`input[type="radio"][value="${targetIdx}"]`).check();

    const nextBtn = page.locator('#quiz-next-btn');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    if (i === correctAnswers.length - 1) break;

    await page.waitForTimeout(200);
  }
}

test.describe('Module Quiz', () => {
  test.beforeAll(async () => {
    serverProcess = spawn('python3', ['-m', 'http.server', String(TEST_PORT)], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'ignore',
    });

    await waitForServer(`${TEST_ORIGIN}/module-1.html`);
  });

  test.afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
  });

  test('passing the quiz renders pass state', async ({ page }) => {
    await page.goto(`${TEST_ORIGIN}/module-1.html`);
    await page.waitForSelector('.module-quiz__question', { timeout: 15000 });

    const correctAnswers = await loadQuizData(page, 'module-1');
    expect(correctAnswers.length).toBeGreaterThan(0);

    await answerAllQuestions(page, correctAnswers, false);

    await expect(page.locator('#quiz-results')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#quiz-results')).toContainText('Passed');
  });

  test('failing the quiz renders fail state and retry button', async ({ page }) => {
    await page.goto(`${TEST_ORIGIN}/module-1.html`);
    await page.waitForSelector('.module-quiz__question', { timeout: 15000 });

    const correctAnswers = await loadQuizData(page, 'module-1');
    expect(correctAnswers.length).toBeGreaterThan(0);

    await answerAllQuestions(page, correctAnswers, true);

    await expect(page.locator('#quiz-results')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#quiz-results')).toContainText('Needs Retake');
    await expect(page.locator('button:has-text("Retake Test")')).toBeVisible();
  });

  test('action plan is written to localStorage after completion', async ({ page }) => {
    await page.goto(`${TEST_ORIGIN}/module-1.html`);
    await page.waitForSelector('.module-quiz__question', { timeout: 15000 });

    const correctAnswers = await loadQuizData(page, 'module-1');
    await answerAllQuestions(page, correctAnswers, false);

    await expect(page.locator('#quiz-results')).toBeVisible({ timeout: 10000 });

    const actionPlan = await page.evaluate(() => localStorage.getItem('efi_action_plans_v1'));
    expect(actionPlan).not.toBeNull();
  });

});
