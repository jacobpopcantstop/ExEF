const { test, expect } = require('@playwright/test');

test.describe('Lazy Loading — images', () => {

  test('all below-fold images have loading="lazy" on representative pages', async ({ page }) => {
    const pages = ['index.html', 'resources.html', 'about.html', 'coaching-home.html', 'blog-time-blindness.html'];
    for (const p of pages) {
      await page.goto(`/${p}`, { waitUntil: 'domcontentloaded' });
      // Above-the-fold images and the hero (fetchpriority="high") should load
      // eagerly for LCP, so only other images below the first viewport are checked.
      const eagerBelowFold = await page.evaluate(() => {
        const fold = window.innerHeight;
        return Array.from(document.querySelectorAll('img[src^="images/"]'))
          .filter((img) => img.getBoundingClientRect().top + window.scrollY > fold)
          .filter((img) => img.getAttribute('fetchpriority') !== 'high')
          .filter((img) => img.getAttribute('loading') !== 'lazy')
          .map((img) => img.getAttribute('src'));
      });
      expect(eagerBelowFold, `${p} below-fold images without loading="lazy"`).toEqual([]);
    }
  });

});
