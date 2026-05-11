import { expect, test } from '@playwright/test';
import { expectNoBlockingAxeViolations } from './a11yAssertions.js';

test.describe('accessibility smoke', () => {
  test('auth page has no serious axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expectNoBlockingAxeViolations(page);
  });

  test('guest preview has no serious axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    const previewButton = page.getByRole('button', { name: /preview a lesson before signing in/i });
    await previewButton.scrollIntoViewIfNeeded();
    await previewButton.click();
    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
    await expectNoBlockingAxeViolations(page);
  });
});
