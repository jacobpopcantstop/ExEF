const { test, expect } = require('@playwright/test');

test.describe('Service Worker', () => {

  test('sw.js is served and contains expected cache references', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('efi-static-v2');
    expect(body).toContain('/js/main.min.js');
    expect(body).toContain('/js/main.bundle.min.js');
    expect(body).toContain('/js/nav-auth.min.js');
    expect(body).toContain('/js/search.min.js');
    // Should NOT reference unminified fallback files
    expect(body).not.toContain("'/js/main.js'");
    expect(body).not.toContain("'/js/search.js'");
  });

});
