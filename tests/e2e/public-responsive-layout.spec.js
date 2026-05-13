import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { width: 320, height: 720, label: 'compact phone' },
  { width: 390, height: 844, label: 'standard phone' },
  { width: 430, height: 932, label: 'large phone' },
];

async function expectNoHorizontalOverflow(page, label) {
  const result = await page.evaluate(() => {
    const scrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0,
    );
    const viewportWidth = window.innerWidth;
    return { scrollWidth, viewportWidth };
  });

  expect(
    result.scrollWidth,
    `${label} should not create horizontal page scroll`,
  ).toBeLessThanOrEqual(result.viewportWidth + 1);
}

async function openPreviewLesson(page) {
  await page.goto('/');
  await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /preview a lesson/i }).click();
  await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 15000 });
}

test.describe('public responsive mobile layout', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`auth entry and preview lesson fit ${viewport.label} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/');
      await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
      await expectNoHorizontalOverflow(page, `${viewport.label} auth entry`);

      const previewButton = page.getByRole('button', { name: /preview a lesson/i });
      await expect(previewButton).toBeVisible();
      const previewButtonBox = await previewButton.boundingBox();
      expect(previewButtonBox?.height || 0, 'preview lesson button should stay tap-friendly').toBeGreaterThanOrEqual(44);

      await openPreviewLesson(page);
      await expectNoHorizontalOverflow(page, `${viewport.label} preview lesson`);

      const lessonHeading = page.locator('.guest-preview h1, .lesson-title').first();
      await expect(lessonHeading).toBeVisible();
      const headingBox = await lessonHeading.boundingBox();
      expect(headingBox?.width || 0, 'preview lesson heading should fit viewport').toBeLessThanOrEqual(viewport.width);
    });
  }
});
