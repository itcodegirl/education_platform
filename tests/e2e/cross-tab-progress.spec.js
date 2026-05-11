import { expect, test } from '@playwright/test';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

async function loginAndLoad(page) {
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

  const whatsNewVisible = await page.locator('.whats-new-modal, .whats-new-overlay').isVisible().catch(() => false);
  if (whatsNewVisible) {
    await page.click('.whats-new-close, .modal-close');
  }

  await page.waitForSelector('.sidebar', { timeout: 15000 });
}

test.describe('cross-tab lesson progress sync', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable cross-tab sync tests.`,
  );

  test('completing a lesson in one tab reflects in a second tab without reload', async ({ browser }) => {
    // Open two isolated contexts (separate storage = same-origin, separate sessions)
    // Both share the same user credentials so Supabase reflects the same account.
    // The BroadcastChannel is same-origin, so it bridges tabs in the same browser process.
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Log in on both tabs concurrently
      await Promise.all([loginAndLoad(page1), loginAndLoad(page2)]);

      // Identify the first lesson button in tab 1's sidebar and read its key
      const firstLesson = page1.locator('.lesson-list-btn').first();
      await firstLesson.waitFor({ timeout: 10000 });
      const lessonLabel = await firstLesson.textContent();

      // Ensure the lesson is NOT already marked done in either tab
      const isDoneInTab1 = await firstLesson.evaluate(el => el.classList.contains('dn'));
      if (isDoneInTab1) {
        // Unmark it first so we have a clean starting state
        await firstLesson.click();
        await page1.waitForSelector('.mark-btn', { timeout: 5000 });
        await page1.click('.mark-btn');
        await page1.waitForTimeout(500);
      }

      // Click the lesson in tab 1 to open it
      await firstLesson.click();
      await page1.waitForSelector('.mark-btn', { timeout: 10000 });

      // Confirm it is not done yet
      const markBtn = page1.locator('.mark-btn');
      await expect(markBtn).not.toHaveClass(/dn/, { timeout: 5000 });

      // Mark the lesson complete in tab 1
      await markBtn.click();

      // Wait for the optimistic UI to show done in tab 1
      await expect(markBtn).toHaveClass(/dn/, { timeout: 10000 });

      // Tab 2 should reflect the same lesson as done in its sidebar
      // WITHOUT a page reload — the BroadcastChannel message bridges the tabs.
      const lessonInTab2 = page2.locator('.lesson-list-btn', { hasText: lessonLabel?.trim() }).first();
      await expect(lessonInTab2).toHaveClass(/dn/, { timeout: 5000 });

      // Clean up: unmark the lesson so the test is idempotent
      await markBtn.click();
      await expect(markBtn).not.toHaveClass(/dn/, { timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
