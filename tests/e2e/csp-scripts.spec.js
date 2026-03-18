const { test, expect } = require('@playwright/test');

test.describe('CSP — no inline scripts', () => {

  test('no executable inline script blocks on representative pages', async ({ page }) => {
    const pages = [
      'index.html', 'about.html', 'login.html', 'dashboard.html',
      'store.html', 'search.html', 'gap-analyzer.html', 'community.html',
      'verify.html', '404.html', 'certificate.html', 'admin.html'
    ];
    for (const p of pages) {
      await page.goto(`/${p}`, { waitUntil: 'domcontentloaded' });
      const inlineScripts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script'))
          .filter(s => !s.src && !s.type)
          .length;
      });
      expect(inlineScripts, `${p} should have no executable inline scripts`).toBe(0);
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
