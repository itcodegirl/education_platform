import { expect, test } from '@playwright/test';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

test.describe('mobile learning smoke', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable mobile learning smoke tests.`,
  );

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chrome',
      'This smoke test is scoped to mobile-chrome only.',
    );

    await page.goto('/');
    await page.waitForSelector('.auth-form, .shell, .welcome-overlay', { timeout: 30000 });

    const onAuthPage = await page.locator('.auth-form').isVisible().catch(() => false);
    if (onAuthPage) {
      await page.fill('input[type="email"]', process.env.E2E_EMAIL);
      await page.fill('input[type="password"]', process.env.E2E_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForSelector('.shell, .welcome-overlay', { timeout: 30000 });
    }

    const welcomeVisible = await page.locator('.welcome-overlay').isVisible().catch(() => false);
    if (welcomeVisible) {
      await page.click('.welcome-dismiss, .welcome-resume-btn');
      await page.waitForSelector('.shell', { timeout: 10000 });
    }

    await page.keyboard.press('Escape').catch(() => {});
    await expect(page.locator('.shell')).toBeVisible({ timeout: 30000 });
  });

  test('opens resources from sidebar and search from topbar', async ({ page }) => {
    await page.getByLabel('Open course navigation').click();
    await expect(page.locator('#course-sidebar.open')).toBeVisible();

    await page.getByRole('tab', { name: /resources/i }).click();
    await page.getByRole('button', { name: /cheat sheets/i }).first().click();
    await expect(page.locator('.search-modal')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByLabel('Close sidebar').click();

    await page.getByLabel('Open lesson search').click();
    await expect(page.locator('.search-input')).toBeVisible();
  });
});

