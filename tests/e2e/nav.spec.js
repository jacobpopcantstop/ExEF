const { test, expect } = require('@playwright/test');


test.describe('Navigation — Search link', () => {

  test('Search link present in rebuilt footer on representative pages', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const pages = ['index.html', 'coaching-home.html', 'resources.html'];
    for (const p of pages) {
      await page.goto(`/${p}`);
      await page.waitForSelector('.nav__cluster', { timeout: 10000 });
      const searchLink = page.locator('footer a', { hasText: 'Search' });
      await expect(searchLink).toHaveCount(1, { timeout: 5000 });
      await expect(searchLink).toHaveAttribute('href', /^\/?search(\.html)?$/);
    }
  });

  test('mobile hamburger toggles open and closed reliably across repeated taps', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav__toggle', { timeout: 10000 });

    const toggle = page.locator('.nav__toggle');
    const links = page.locator('.nav__links');

    await toggle.click();
    await expect(links).toHaveClass(/open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();
    await expect(links).not.toHaveClass(/open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(links).toHaveClass(/open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

});

test.describe('Navigation — booking button', () => {

  for (const width of [390, 1280, 1600]) {
    test(`"Book a free call" is visible without opening the menu at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/index.html');
      const book = page.locator('.nav__inner > .nav__book');
      await expect(book).toHaveCount(1, { timeout: 10000 });
      await expect(book).toBeVisible();
      await expect(book).toHaveText(/book a free call/i);
      await expect(book).toHaveAttribute('data-analytics-event', 'book_call_click');
      await expect(book).toHaveAttribute('href', /calendly\.com\/.*utm_content=nav-cta/);
      const box = await book.boundingBox();
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    });
  }

});

test.describe('Navigation — active state', () => {

  test('highlights the current section on extensionless URLs', async ({ page }) => {
    // Production serves /resources (no .html); emulate Netlify's pretty URLs.
    await page.route('**/resources', (route) => route.fulfill({ path: 'resources.html' }));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/resources');
    const active = page.locator('.nav__link--active');
    await expect(active).toHaveCount(1, { timeout: 10000 });
    await expect(active).toHaveText('Resources');
  });

});

test.describe('Dark Mode (retired)', () => {

  test('a stale dark preference is cleared and never applied', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('efi_theme', 'dark');
    });

    await page.goto('/index.html', { waitUntil: 'load' });
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.dark-toggle')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('efi_theme'))).toBeNull();
  });

});

test.describe('Accessibility', () => {

  test('skip link is first tab stop on index.html', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    });
    await page.keyboard.press('Tab');

    const focusedClass = await page.evaluate(
      () => document.activeElement?.className || ''
    );
    expect(focusedClass).toContain('skip-link');
  });

});
