const { test, expect } = require('@playwright/test');

test.describe('CSP — no inline scripts', () => {

  test('no executable inline scripts or inline handlers on any live page', async ({ page }) => {
    // The site CSP (script-src 'self') silently blocks both, so check every
    // public page rather than a sample. Retired pages redirect away.
    const fs = require('fs');
    const path = require('path');
    const visibility = require('../../data/site-visibility.json');
    const retired = new Set([...visibility.hiddenPages, 'checkout.html', 'checkout-return.html', 'login.html', 'community.html']);
    const pages = fs.readdirSync(path.resolve(__dirname, '../..'))
      .filter(f => f.endsWith('.html') && !retired.has(f));
    for (const p of pages) {
      await page.goto(`/${p}`, { waitUntil: 'domcontentloaded' });
      const found = await page.evaluate(() => ({
        scripts: Array.from(document.querySelectorAll('script'))
          .filter(s => !s.src && (!s.type || s.type === 'text/javascript' || s.type === 'module')).length,
        handlers: Array.from(document.querySelectorAll('*'))
          .filter(el => Array.from(el.attributes).some(a => /^on[a-z]+$/.test(a.name))).length
      }));
      expect(found.scripts, `${p} should have no executable inline scripts`).toBe(0);
      expect(found.handlers, `${p} should have no inline on* handlers`).toBe(0);
    }
  });

  test('all script tags have src attribute or non-executable type', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).map(s => ({
        src: s.src || null,
        type: s.type || null
      }));
    });
    for (const script of scripts) {
      const isExternal = !!script.src;
      const isData = script.type === 'application/ld+json';
      expect(isExternal || isData, 'All scripts must be external or data-only').toBe(true);
    }
  });

});
