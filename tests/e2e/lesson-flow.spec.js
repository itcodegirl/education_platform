import { expect, test } from '@playwright/test';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

test.describe('lesson flow', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable lesson flow tests.`
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-form, .shell, .welcome-overlay', { timeout: 30000 });

    // Login if on auth page
    const onAuthPage = await page.locator('.auth-form').isVisible().catch(() => false);
    if (onAuthPage) {
      await page.fill('input[type="email"]', process.env.E2E_EMAIL);
      await page.fill('input[type="password"]', process.env.E2E_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForSelector('.shell, .welcome-overlay', { timeout: 30000 });
    }

    // Dismiss welcome-back if present
    const welcomeVisible = await page.locator('.welcome-overlay').isVisible().catch(() => false);
    if (welcomeVisible) {
      await page.click('.welcome-dismiss, .welcome-resume-btn');
      await page.waitForSelector('.shell', { timeout: 10000 });
    }

    // Dismiss what's new if present
    const whatsNewVisible = await page.locator('.search-overlay').isVisible().catch(() => false);
    if (whatsNewVisible) {
      await page.keyboard.press('Escape');
    }
  });

  test('displays lesson content with title and concepts', async ({ page }) => {
    await page.waitForSelector('.lesson-title', { timeout: 10000 });
    const title = await page.textContent('.lesson-title');
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('navigates to next lesson with Next button', async ({ page }) => {
    await page.waitForSelector('.lesson-title', { timeout: 10000 });
    const firstTitle = await page.textContent('.lesson-title');

    await page.click('.nav-btn.nx');
    await page.waitForTimeout(500);

    const secondTitle = await page.textContent('.lesson-title');
    expect(secondTitle).not.toBe(firstTitle);
  });

  test('navigates back with Previous button', async ({ page }) => {
    // Go to second lesson first
    await page.waitForSelector('.nav-btn.nx', { timeout: 10000 });
    await page.click('.nav-btn.nx');
    await page.waitForTimeout(500);

    const secondTitle = await page.textContent('.lesson-title');

    await page.click('.nav-btn:not(.nx)');
    await page.waitForTimeout(500);

    const backTitle = await page.textContent('.lesson-title');
    expect(backTitle).not.toBe(secondTitle);
  });

  test('browser back returns to the previous lesson URL and title', async ({ page }) => {
    await page.waitForSelector('.lesson-title', { timeout: 10000 });
    const firstUrl = page.url();
    const firstTitle = (await page.textContent('.lesson-title'))?.trim();

    await page.click('.nav-btn.nx');
    await page.waitForTimeout(500);

    const secondUrl = page.url();
    expect(secondUrl).not.toBe(firstUrl);

    await page.goBack();

    await expect(page).toHaveURL(firstUrl);
    await expect(page.locator('.lesson-title')).toHaveText(firstTitle || '');
  });

  test('deep-linked lesson URL restores the same lesson after reload', async ({ page }) => {
    await page.waitForSelector('.lesson-title', { timeout: 10000 });
    await page.click('.nav-btn.nx');
    await page.waitForTimeout(500);

    const deepLinkUrl = page.url();
    const deepLinkTitle = (await page.textContent('.lesson-title'))?.trim() || '';

    await page.goto(deepLinkUrl, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(deepLinkUrl);
    await expect(page.locator('.lesson-title')).toHaveText(deepLinkTitle);
  });

  test('mark done button toggles lesson completion', async ({ page }) => {
    await page.waitForSelector('.mark-btn', { timeout: 10000 });

    const wasDone = await page.locator('.mark-btn.dn').isVisible().catch(() => false);
    await page.click('.mark-btn');
    await page.waitForTimeout(500);

    if (wasDone) {
      // Was done, now should be un-done
      await expect(page.locator('.mark-btn:not(.dn)')).toBeVisible();
    } else {
      // Was not done, now should be done
      await expect(page.locator('.mark-btn.dn')).toBeVisible();
    }
  });

  test('search opens and finds lessons', async ({ page }) => {
    await page.waitForSelector('.search-trigger', { timeout: 10000 });
    await page.click('.search-trigger');
    await page.waitForSelector('.search-input', { timeout: 5000 });

    await page.fill('.search-input', 'HTML');
    await page.waitForTimeout(500);

    const results = await page.locator('.search-result').count();
    expect(results).toBeGreaterThan(0);

    // Close search
    await page.keyboard.press('Escape');
  });

  test('browser back closes search panel before leaving the lesson route', async ({ page }) => {
    await page.waitForSelector('.search-trigger', { timeout: 10000 });
    await page.click('.search-trigger');
    await page.waitForSelector('.search-modal', { timeout: 5000 });

    const urlWithPanelOpen = page.url();
    await page.goBack();

    await expect(page.locator('.search-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/\/learn\/[^/]+\/[^/]+\/[^/]+/);
    expect(page.url()).not.toBe(urlWithPanelOpen);
  });

  test('sidebar shows course switcher and modules', async ({ page }) => {
    // Open sidebar on mobile or verify it's visible on desktop
    const hamVisible = await page.locator('.ham').isVisible().catch(() => false);
    if (hamVisible) {
      await page.click('.ham');
      await page.waitForSelector('#course-sidebar.open', { timeout: 5000 });
    }

    await page.getByRole('button', { name: 'Courses' }).click();
    await page.waitForSelector('.sidebar-tab-flyout-courses', { timeout: 5000 });

    // Course buttons should be visible
    const courseButtons = await page.locator('.cs-option').count();
    expect(courseButtons).toBeGreaterThanOrEqual(4);

    // Module groups should be visible
    const modules = await page.locator('.module-group-btn').count();
    expect(modules).toBeGreaterThan(0);
  });

  test('skip link lands keyboard focus on the main lesson container', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('resources flyout supports menu keyboard controls', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-chrome',
      'Desktop keyboard menu behavior is verified in Chromium desktop.'
    );

    const resourcesTrigger = page.getByRole('button', { name: 'Resources' });
    await resourcesTrigger.focus();
    await page.keyboard.press('ArrowDown');

    const menu = page.getByRole('menu');
    const firstItem = page.getByRole('menuitem', { name: 'Open Cheat Sheets panel' });
    const lastItem = page.getByRole('menuitem', { name: 'Open Badges panel' });

    await expect(menu).toBeVisible();
    await expect(firstItem).toBeFocused();

    await page.keyboard.press('End');
    await expect(lastItem).toBeFocused();

    await page.keyboard.press('Home');
    await expect(firstItem).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(resourcesTrigger).toBeFocused();
  });

  test('desktop collapse toggle sets sidebar to inert until expanded', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-chrome',
      'Desktop-only collapse/inert behavior.'
    );

    const collapseToggle = page.getByRole('button', { name: /collapse course navigation/i });
    await collapseToggle.click();

    const sidebar = page.locator('#course-sidebar');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    await expect(sidebar).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: /expand course navigation/i }).click();
    await expect(sidebar).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('quiz section is collapsible', async ({ page }) => {
    await page.waitForSelector('.lesson-title', { timeout: 10000 });

    // Look for quiz toggle
    const quizToggle = page.locator('.quiz-toggle');
    const hasQuiz = await quizToggle.isVisible().catch(() => false);

    if (hasQuiz) {
      // Quiz should be collapsed by default
      await expect(page.locator('.quiz-questions')).not.toBeVisible();

      // Click to expand
      await quizToggle.click();
      await page.waitForTimeout(300);

      // Questions should now be visible
      await expect(page.locator('.quiz-questions')).toBeVisible();
    }
  });
});
