import { expect, test } from '@playwright/test';
import {
  dismissWelcomeOverlay,
  getMissingE2EAuthConfig,
  loginWithCredentials,
  waitForLearningShell,
} from './authHelpers';

const missingEnv = getMissingE2EAuthConfig();

test.describe('mobile learning smoke', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable mobile learning smoke tests.`,
  );

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-authenticated-chrome' && testInfo.project.name !== 'mobile-chrome',
      'This smoke test is scoped to mobile Chrome projects only.',
    );

    await page.goto('/');
    await page.waitForSelector('.auth-form, .main-shell, .welcome-overlay', { timeout: 30000 });

    const onAuthPage = await page.locator('.auth-form').isVisible().catch(() => false);
    if (onAuthPage) {
      await loginWithCredentials(page, {
        email: process.env.E2E_EMAIL,
        password: process.env.E2E_PASSWORD,
      });
      await waitForLearningShell(page);
    }

    await dismissWelcomeOverlay(page);

    await page.keyboard.press('Escape').catch(() => {});
    await expect(page.locator('.main-shell')).toBeVisible({ timeout: 30000 });
  });

  async function answerQuizQuestions(page) {
    const questions = page.locator('.qq');
    const questionCount = await questions.count();

    for (let index = 0; index < questionCount; index += 1) {
      const question = questions.nth(index);

      const optionButtons = question.locator('.qq-opt');
      if ((await optionButtons.count()) > 0) {
        await optionButtons.first().click();
        continue;
      }

      const bugLineButtons = question.locator('.qq-bug-line');
      if ((await bugLineButtons.count()) > 0) {
        await bugLineButtons.first().click();
        continue;
      }

      const fillInput = question.locator('.qq-fill-input');
      if ((await fillInput.count()) > 0) {
        await fillInput.fill('test');
        continue;
      }

      const reorderButtons = question.locator('.qq-order-btn:not([disabled])');
      if ((await reorderButtons.count()) > 0) {
        await reorderButtons.first().click();
      }
    }
  }

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

  test('navigates lessons, toggles completion, and submits a quiz', async ({ page }) => {
    await expect(page.locator('.lesson-title')).toBeVisible();
    const initialTitle = await page.locator('.lesson-title').textContent();

    const getDoneState = async () =>
      page.locator('.mark-btn').evaluate((node) => node.classList.contains('dn'));

    const previousDoneState = await getDoneState();
    await page.locator('.mark-btn').click();
    await expect.poll(getDoneState).toBe(!previousDoneState);

    await page.locator('.nav-btn.nx').click();
    await expect(page.locator('.lesson-title')).not.toHaveText(initialTitle || '', { timeout: 10000 });

    await page.getByLabel('Open course navigation').click();
    await expect(page.locator('#course-sidebar.open')).toBeVisible();

    let moduleQuizButton = page.locator('.lesson-list-quiz').first();
    if (!(await moduleQuizButton.isVisible().catch(() => false))) {
      await page.locator('.module-group-btn').first().click();
    }
    moduleQuizButton = page.locator('.lesson-list-quiz').first();
    await expect(moduleQuizButton).toBeVisible();
    await moduleQuizButton.click();

    const closeSidebar = page.getByLabel('Close sidebar');
    if (await closeSidebar.isVisible().catch(() => false)) {
      await closeSidebar.click();
    }

    await expect(page.locator('.quiz-container')).toBeVisible();
    await answerQuizQuestions(page);

    const submitButton = page.locator('.quiz-submit');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.locator('.quiz-results')).toBeVisible();
  });
});
