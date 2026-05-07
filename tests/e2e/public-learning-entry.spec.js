import { expect, test } from '@playwright/test';

test.describe('public learner entry', () => {
  test('opens the first lesson preview from the hero without an account', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('link', { name: /design system/i })).toHaveCount(0);

    await page.getByRole('button', { name: /preview the first lesson/i }).first().click();

    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Preview Mode/i)).toBeVisible();
    await expect(page.locator('.lesson-title')).toBeVisible();
    await expect(page.locator('.gp-cta')).toContainText(/track your progress/i);

    await page.getByRole('button', { name: /create free account/i }).click();

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: /create account/i })).toBeVisible();
  });

  test('keeps preview actions reachable on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: /preview the first lesson/i }).first().click();

    const topbar = page.locator('.gp-topbar');
    await expect(topbar).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.lesson-surface')).toBeVisible();

    await expect(topbar).toHaveCSS('position', 'static');

    const createAccountButton = page.getByRole('button', { name: /create free account/i });
    await createAccountButton.scrollIntoViewIfNeeded();
    await expect(createAccountButton).toBeVisible();

    const buttonBox = await createAccountButton.boundingBox();
    const viewport = page.viewportSize();
    expect(buttonBox?.y).toBeGreaterThanOrEqual(0);
    expect((buttonBox?.y || 0) + (buttonBox?.height || 0)).toBeLessThanOrEqual(viewport.height);

    await createAccountButton.focus();
    await expect(createAccountButton).toBeFocused();
  });
});
