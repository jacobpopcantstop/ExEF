const { test, expect } = require('@playwright/test');

test.describe('Lazy Loading — images', () => {

  test('all below-fold images have loading="lazy" on representative pages', async ({ page }) => {
    const pages = ['index.html', 'resources.html', 'about.html', 'store.html', 'curriculum.html'];
    for (const p of pages) {
      await page.goto(`/${p}`, { waitUntil: 'domcontentloaded' });
      const images = page.locator('img[src^="images/"]');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        await expect(img).toHaveAttribute('loading', 'lazy', {
          timeout: 2000
        });
      }
    }
  });

});
