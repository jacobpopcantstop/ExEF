const { test, expect } = require('@playwright/test');

test.describe('Auth UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {}
    });
  });

  test('login/register toggle updates hero copy and visible panel', async ({ page }) => {
    await page.goto('/login.html', { waitUntil: 'domcontentloaded' });

    const heroTitle = page.locator('#auth-hero-title');
    const heroLead = page.locator('#auth-hero-lead');
    const loginPanel = page.locator('#login-panel');
    const registerPanel = page.locator('#register-panel');

    await expect(heroTitle).toHaveText('Welcome Back');
    await expect(heroLead).toContainText('Log in to access your dashboard');
    await expect(loginPanel).toBeVisible();
    await expect(registerPanel).toBeHidden();

    await page.getByRole('button', { name: 'Create one' }).click();

    await expect(heroTitle).toHaveText('Welcome');
    await expect(heroLead).toContainText('Create an account to access your EFI dashboard');
    await expect(registerPanel).toBeVisible();
    await expect(loginPanel).toBeHidden();

    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(heroTitle).toHaveText('Welcome Back');
    await expect(heroLead).toContainText('purchase records');
    await expect(loginPanel).toBeVisible();
    await expect(registerPanel).toBeHidden();
  });

});

test.describe('Search', () => {

  test('query string hydrates the input and renders matching results', async ({ page }) => {
    await page.goto('/search.html?q=esqr', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#search-status')).toContainText('result', { timeout: 10000 });
    await expect(page.locator('#search-input')).toHaveValue('esqr');

    const esqrResult = page.locator('.search-result-card', {
      has: page.locator('h3', { hasText: 'Free Executive Functioning Test (ESQ-R) | EFI' })
    });

    await expect(esqrResult).toBeVisible();
    await expect(esqrResult).toHaveAttribute('href', '/esqr.html');
  });

  test('typed queries persist across reload and keep result rendering stable', async ({ page }) => {
    await page.goto('/search.html', { waitUntil: 'domcontentloaded' });

    const input = page.locator('#search-input');
    await input.fill('time blindness');

    await expect(page).toHaveURL(/\/search\.html\?q=time%20blindness$/);
    await expect(page.locator('#search-status')).toContainText('result', { timeout: 10000 });

    const result = page.locator('.search-result-card', {
      has: page.locator('h3', { hasText: 'Time Blindness Calibrator | EFI' })
    });

    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute('href', '/time-blindness-calibrator.html');

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(input).toHaveValue('time blindness');
    await expect(page).toHaveURL(/\/search\.html\?q=time%20blindness$/);
    await expect(result).toBeVisible();
  });

});
