import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function formatViolations(violations) {
  return violations
    .map((violation) => `${violation.id} (${violation.impact}) on ${violation.nodes.length} node(s)`)
    .join('\n');
}

async function expectNoSeriousViolations(page) {
  const runAxe = async () => {
    return new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
  };

  let results;
  try {
    results = await runAxe();
  } catch (error) {
    const shouldRetry = String(error).includes('Execution context was destroyed');
    if (!shouldRetry) throw error;
    await page.waitForLoadState('domcontentloaded');
    results = await runAxe();
  }

  const blocking = results.violations.filter((violation) => {
    return violation.impact === 'serious' || violation.impact === 'critical';
  });

  expect(
    blocking,
    `Accessibility violations detected:\n${formatViolations(blocking)}`,
  ).toEqual([]);
}

test.describe('accessibility smoke', () => {
  test('auth page has no serious axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await expectNoSeriousViolations(page);
  });

  test('guest preview has no serious axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await page.locator('.auth-preview-btn').click();
    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await expectNoSeriousViolations(page);
  });
});
