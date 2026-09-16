const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Tracking is disabled on localhost/127.0.0.1 (see TRACKING_ENABLED in
// js/main.js), so these tests serve the repo from disk under the production
// origin and stub gtag + /api/* instead of hitting the network.

const ROOT = path.resolve(__dirname, '../..');
const ORIGIN = 'https://exef.org';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

function resolveFile(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
  const candidate = path.resolve(ROOT, rel);
  if (!candidate.startsWith(ROOT)) return null;
  for (const file of [candidate, candidate + '.html']) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

async function setUpPage(page) {
  await page.addInitScript(() => {
    window.__gaEvents = [];
    // google-analytics.js only assigns gtag if it is undefined, so this stub
    // survives and records every event the bridge forwards.
    window.dataLayer = [];
    window.gtag = function () {
      if (arguments[0] === 'event') {
        window.__gaEvents.push({ name: arguments[1], params: arguments[2] });
      }
    };
    const realFetch = window.fetch.bind(window);
    window.fetch = function (input) {
      const url = String(typeof input === 'string' ? input : (input && input.url) || '');
      if (url.indexOf('/api/') !== -1) {
        return Promise.resolve(new Response('{"ok":true}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return realFetch.apply(this, arguments);
    };
  });

  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));

  await page.route(ORIGIN + '/**', async (route) => {
    const file = resolveFile(new URL(route.request().url()).pathname);
    if (!file) return route.fulfill({ status: 404, body: 'not found' });
    await route.fulfill({
      status: 200,
      contentType: CONTENT_TYPES[path.extname(file)] || 'application/octet-stream',
      body: fs.readFileSync(file),
    });
  });
}

function gaEvents(page) {
  return page.evaluate(() => window.__gaEvents);
}

async function gotoTracked(page, pathname) {
  await page.goto(ORIGIN + pathname);
  await page.waitForFunction(() => window.EFI && window.EFI.Analytics);
}

test.describe('GA4 event bridge', () => {
  test.beforeEach(({ page }) => setUpPage(page));

  test('forwards data-analytics-event clicks to gtag', async ({ page }) => {
    await gotoTracked(page, '/free-executive-functioning-tests');
    await page.evaluate(() => {
      document.addEventListener('click', (e) => e.preventDefault(), true);
      document.querySelector('[data-analytics-event="book_call_click"]').click();
    });
    const events = await gaEvents(page);
    const booking = events.find((e) => e.name === 'book_call_click');
    expect(booking, 'book_call_click reached gtag').toBeTruthy();
    expect(booking.params.page_slug).toBe('free-executive-functioning-tests');
  });

  test('does not re-send page_view that GA4 collects itself', async ({ page }) => {
    await gotoTracked(page, '/');
    const events = await gaEvents(page);
    expect(events.map((e) => e.name)).not.toContain('page_view');
  });

  test('tracks PDF clicks as resource_download', async ({ page }) => {
    await gotoTracked(page, '/resources');
    await page.evaluate(() => {
      document.addEventListener('click', (e) => e.preventDefault(), true);
      document.querySelector('a[href$=".pdf"]').click();
    });
    const events = await gaEvents(page);
    const download = events.find((e) => e.name === 'resource_download');
    expect(download, 'resource_download reached gtag').toBeTruthy();
    expect(download.params.file_extension).toBe('pdf');
    expect(download.params.file_name).toMatch(/\.pdf$/);
  });

  test('tracks assessment_completed when a quiz is submitted', async ({ page }) => {
    await gotoTracked(page, '/sleep-functioning-quiz');
    await page.waitForSelector('#sleep-quiz-form input[type="radio"]', { state: 'attached' });
    await page.evaluate(() => {
      const names = new Set();
      document.querySelectorAll('#sleep-quiz-form input[type="radio"]')
        .forEach((input) => names.add(input.name));
      names.forEach((name) => {
        const input = document.querySelector('#sleep-quiz-form input[name="' + name + '"]');
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    await page.click('#sleep-quiz-form button[type="submit"]');
    await expect.poll(async () => (await gaEvents(page)).map((e) => e.name))
      .toContain('assessment_completed');
    const completed = (await gaEvents(page)).find((e) => e.name === 'assessment_completed');
    expect(completed.params.tool).toBe('sleep-functioning-quiz');
  });

  test('restoring a saved quiz result does not re-fire assessment_completed', async ({ page }) => {
    await gotoTracked(page, '/environment-quiz');
    await page.waitForSelector('#environment-quiz-form input[type="radio"]', { state: 'attached' });
    await page.evaluate(() => {
      const names = new Set();
      document.querySelectorAll('#environment-quiz-form input[type="radio"]')
        .forEach((input) => names.add(input.name));
      names.forEach((name) => {
        const input = document.querySelector('#environment-quiz-form input[name="' + name + '"]');
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    await page.click('#environment-quiz-form button[type="submit"]');
    await expect.poll(async () => (await gaEvents(page)).map((e) => e.name))
      .toContain('assessment_completed');

    // Reload: the tool re-renders the stored result, which must not count
    // as a second completion.
    await gotoTracked(page, '/environment-quiz');
    await page.waitForTimeout(500);
    const names = (await gaEvents(page)).map((e) => e.name);
    expect(names).not.toContain('assessment_completed');
  });
});
