const { test, expect } = require('@playwright/test');

async function chooseRating(item, value) {
  await item.scrollIntoViewIfNeeded();
  const option = item.locator('.esqr-rating__option').nth(value - 1);
  const visibleSurface = option.locator('span');
  const input = option.locator('input[type="radio"]');
  await visibleSurface.click();
  await expect(input).toBeChecked();
}

test.describe('ESQ-R Assessment', () => {

  test('full quiz completion renders result card', async ({ page }) => {
    await page.goto('/esqr.html');
    await page.waitForSelector('.esqr-item');

    const items = page.locator('.esqr-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await chooseRating(items.nth(i), 3);
    }

    await page.getByRole('button', { name: 'Generate My ESQ-R Profile' }).click();
    await expect(page.locator('#esqr-results')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#esqr-results').locator('> *').first()).toBeVisible();
  });

  test('draft persists across page reload', async ({ page }) => {
    await page.goto('/esqr.html');
    await page.waitForSelector('.esqr-item');

    const items = page.locator('.esqr-item');
    const count = await items.count();
    const answerCount = Math.min(5, count);

    for (let i = 0; i < answerCount; i++) {
      await chooseRating(items.nth(i), 3);
    }

    await page.reload();
    await page.waitForSelector('.esqr-item');

    const reloaded = page.locator('.esqr-item');
    for (let i = 0; i < answerCount; i++) {
      await expect(reloaded.nth(i).locator('input[type="radio"][value="3"]')).toBeChecked();
    }
  });

  test('progress bar advances as questions are answered', async ({ page }) => {
    await page.goto('/esqr.html');
    await page.waitForSelector('.esqr-item');

    const items = page.locator('.esqr-item');
    const count = await items.count();
    const bar = page.locator('.esqr-progress__fill');

    const initialWidth = await bar.evaluate(el => el.getBoundingClientRect().width);

    const half = Math.floor(count / 2);
    for (let i = 0; i < half; i++) {
      await chooseRating(items.nth(i), 3);
    }

    const newWidth = await bar.evaluate(el => el.getBoundingClientRect().width);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

});
