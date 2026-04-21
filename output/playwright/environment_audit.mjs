import { chromium, devices } from 'playwright';
import fs from 'fs/promises';

const base = 'http://127.0.0.1:4175/environment-quiz.html';
const outDir = '/Users/jacobrozansky/exef/output/playwright';

async function collect(page, label) {
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(String((err && err.message) || err)));

  await page.goto(base, { waitUntil: 'networkidle' });

  const initial = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const overflow = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1) {
        overflow.push({
          tag: el.tagName.toLowerCase(),
          cls: el.className || '',
          id: el.id || '',
          right: Math.round(r.right),
          width: Math.round(r.width),
          text: (el.innerText || '').trim().slice(0, 80)
        });
      }
    });
    return {
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      overflow: overflow.slice(0, 15),
      progressText: document.getElementById('environment-progress-text')?.textContent || null
    };
  });

  await page.screenshot({ path: outDir + '/' + label + '-initial.png', fullPage: true });

  const groups = await page.locator('.environment-group').count();
  for (let g = 0; g < groups; g++) {
    const value = String(g % 5);
    await page.locator('.environment-group').nth(g).evaluate((groupEl, selectedValue) => {
      groupEl.querySelectorAll('input[type="radio"][value="' + selectedValue + '"]').forEach((input) => {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }, value);
  }

  await page.click('button[type="submit"]');
  await page.waitForTimeout(900);

  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.click('#environment-export-btn');
  const download = await downloadPromise;
  const downloadedFile = download ? download.suggestedFilename() : null;

  await page.click('#environment-reset-btn');
  await page.waitForTimeout(300);

  const final = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const overflow = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1) {
        overflow.push({
          tag: el.tagName.toLowerCase(),
          cls: el.className || '',
          id: el.id || '',
          right: Math.round(r.right),
          width: Math.round(r.width),
          text: (el.innerText || '').trim().slice(0, 80)
        });
      }
    });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      overflow: overflow.slice(0, 15),
      totalScore: document.getElementById('environment-total-score')?.textContent || null,
      band: document.getElementById('environment-total-band')?.textContent || null,
      quickWinCount: document.querySelectorAll('.environment-quick-win').length,
      scorecardCount: document.querySelectorAll('.environment-scorecard').length,
      resultHidden: document.getElementById('environment-results')?.hidden,
      shareStatus: document.getElementById('environment-share-status')?.textContent || null,
      activeElement: (document.activeElement && (document.activeElement.id || document.activeElement.tagName)) || null,
      progressAfterReset: document.getElementById('environment-progress-text')?.textContent || null
    };
  });

  final.exportFile = downloadedFile;

  await page.screenshot({ path: outDir + '/' + label + '-results.png', fullPage: true });

  return { label, initial, final, consoleMessages, pageErrors };
}

const browser = await chromium.launch({ headless: true });

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 2200 }
});
const desktopPage = await desktopContext.newPage();
const desktop = await collect(desktopPage, 'environment-desktop');
await desktopContext.close();

const mobileContext = await browser.newContext({
  ...devices['iPhone 13']
});
const mobilePage = await mobileContext.newPage();
const mobile = await collect(mobilePage, 'environment-mobile');
await mobileContext.close();

await browser.close();

const result = { desktop, mobile };
await fs.writeFile(outDir + '/environment-audit.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
