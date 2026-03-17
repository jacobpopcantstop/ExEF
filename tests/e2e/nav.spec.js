const { test, expect } = require('@playwright/test');

async function gotoIndex(page) {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.dark-toggle', { timeout: 10000 });
}

test.describe('Navigation — Search link', () => {

  test('Search link present in rebuilt nav on representative pages', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const pages = ['index.html', 'curriculum.html', 'resources.html'];
    for (const p of pages) {
      await page.goto(`/${p}`);
      await page.waitForSelector('.nav__cluster', { timeout: 10000 });
      const searchLink = page.locator('nav a[href="search.html"]');
      await expect(searchLink).toBeVisible({ timeout: 5000 });
      await expect(searchLink).toContainText('Search');
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

test.describe('Dark Mode', () => {

  test('toggle switches data-theme to dark', async ({ page }) => {
    await gotoIndex(page);

    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    await page.locator('.dark-toggle').evaluate(el => el.click());
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('dark mode persists across page reload', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('efi_theme', 'dark');
    });

    await gotoIndex(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dark-toggle', { timeout: 10000 });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('dark mode hero background is not cream (regression guard)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('efi_theme', 'dark');
    });

    await gotoIndex(page);
    await page.waitForSelector('.hero');

    const heroBg = await page.locator('.hero').evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );

    expect(heroBg).not.toBe('rgb(247, 243, 235)');
    expect(heroBg).not.toBe('rgb(255, 255, 255)');
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
