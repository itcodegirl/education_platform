import { expect, test } from '@playwright/test';

test.describe('public learner entry', () => {
  test('opens the first lesson preview from the hero without an account', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('link', { name: /design system/i })).toHaveCount(0);

    await page.getByRole('button', { name: /preview the first lesson/i }).first().click();

    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Preview Mode/i)).toBeVisible();
    await expect(page.getByRole('heading', {
      level: 1,
      name: /make your name appear in a browser/i,
    })).toBeVisible();
    await expect(page.locator('.gp-cta')).toContainText(/track and save your progress/i);
    await expect(page.locator('.gp-cta')).toContainText(/full lesson library/i);
    await expect(page.locator('.gp-cta')).not.toContainText(/\d+\+ lessons/i);

    await page.getByRole('button', { name: /create free account/i }).click();

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: /create account/i })).toBeVisible();
  });
});
