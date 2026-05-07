import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page) {
  const result = await page.evaluate(() => {
    const scrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0,
    );
    const viewportWidth = window.innerWidth;
    const offenders = Array.from(document.body.querySelectorAll('*'))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === 'string' ? node.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0,
        };
      })
      .filter((item) => item.visible && (item.left < -1 || item.right > viewportWidth + 1))
      .slice(0, 5);

    return {
      scrollWidth,
      viewportWidth,
      offenders,
    };
  });

  expect(
    result.scrollWidth,
    `Horizontal overflow at ${result.viewportWidth}px. Offenders: ${JSON.stringify(result.offenders)}`,
  ).toBeLessThanOrEqual(result.viewportWidth + 1);
}

async function expectTouchTarget(locator) {
  const box = await locator.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(44);
  expect(box?.height || 0).toBeGreaterThanOrEqual(44);
}

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

  test('publicMobileViewportsAvoidHorizontalOverflow', async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 780 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
      await expectNoHorizontalOverflow(page);

      const previewButton = page.getByRole('button', { name: /preview the first lesson/i }).first();
      await expectTouchTarget(previewButton);
      await previewButton.click();

      await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
      await expectNoHorizontalOverflow(page);

      const createAccountButton = page.getByRole('button', { name: /create free account/i });
      await createAccountButton.scrollIntoViewIfNeeded();
      await expect(createAccountButton).toBeVisible();
      await expectTouchTarget(createAccountButton);
    }
  });
});
