import { expect, test } from '@playwright/test';
import { getAuthSkipReason, getMissingAuthEnv } from './authE2E.js';
import { dismissWelcomeOverlay } from './authHelpers';

const missingEnv = getMissingAuthEnv();

test.describe('mobile learning smoke', () => {
  test.setTimeout(90000);
  let diagnostics;

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable mobile learning smoke tests.`,
  );

  test.beforeEach(async ({ page }, testInfo) => {
    diagnostics = createMobileDiagnostics(page);

    test.skip(
      testInfo.project.name !== 'authenticated-mobile-chrome',
      'This smoke test is scoped to authenticated mobile Chrome only.',
    );
    const authSkipReason = getAuthSkipReason();
    test.skip(Boolean(authSkipReason), authSkipReason);

    await page.goto('/');
    await page.waitForSelector('.auth-form, .main-shell, .welcome-overlay', { timeout: 30000 });

    const onAuthPage = await page.locator('.auth-form').isVisible().catch(() => false);
    if (onAuthPage) {
      test.skip(true, 'Authenticated mobile smoke could not restore the shared signed-in state.');
    }

    await dismissWelcomeOverlay(page);

    await page.keyboard.press('Escape').catch(() => {});
    await expect(page.locator('.main-shell')).toBeVisible({ timeout: 30000 });
  });

  test.afterEach(() => {
    expect(
      diagnostics?.duplicateSupabaseClientWarnings || [],
      'Authenticated mobile flow should not create duplicate Supabase auth clients.',
    ).toEqual([]);
  });

  function createMobileDiagnostics(page) {
    const nextDiagnostics = {
      duplicateSupabaseClientWarnings: [],
    };

    page.on('console', (message) => {
      const text = message.text();
      if (/Multiple GoTrueClient instances/i.test(text)) {
        nextDiagnostics.duplicateSupabaseClientWarnings.push(text);
      }
    });

    return nextDiagnostics;
  }

  async function expectNoHorizontalOverflow(page) {
    const result = await page.evaluate(() => {
      const scrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth || 0,
      );
      const viewportWidth = window.innerWidth;
      return { scrollWidth, viewportWidth };
    });

    expect(result.scrollWidth).toBeLessThanOrEqual(result.viewportWidth + 1);
  }

  async function expectControlAboveBottomNavigation(page, locator) {
    await locator.scrollIntoViewIfNeeded();
    const controlBox = await locator.boundingBox();
    expect(controlBox).toBeTruthy();

    const navBox = await page.locator('.lesson-nav').boundingBox().catch(() => null);
    const viewport = page.viewportSize();
    const availableBottom = navBox?.y ?? viewport.height;

    expect((controlBox?.y || 0) + (controlBox?.height || 0)).toBeLessThanOrEqual(availableBottom);
  }

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

  test('opens sidebar tools, search, and the mobile tools sheet', async ({ page }) => {
    await page.getByLabel('Open course navigation').click();
    await expect(page.locator('#course-sidebar.open')).toBeVisible();

    await page.getByRole('button', { name: /tools/i }).click();
    await page.getByRole('menuitem', { name: /cheat sheets/i }).click();
    await expect(page.locator('.search-modal')).toBeVisible();

    await page.keyboard.press('Escape');
    const closeSidebar = page.getByLabel('Close sidebar');
    if (await closeSidebar.isVisible().catch(() => false)) {
      await closeSidebar.click();
    }

    await page.getByLabel('Open lesson search').click();
    await expect(page.locator('.search-input')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByLabel('Open learning tools').click();
    const toolsSheet = page.getByRole('dialog', { name: /learning tools/i });
    await expect(toolsSheet).toBeVisible();

    await toolsSheet.getByRole('button', { name: /challenges/i }).click();
    await expect(page.locator('.challenges-panel')).toBeVisible();
  });

  test('mobileSidebarSupportsKeyboardNavigation', async ({ page }) => {
    await page.getByLabel('Open course navigation').click();
    const sidebar = page.locator('#course-sidebar');
    await expect(sidebar).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveClass(/open/);

    await page.getByLabel('Open course navigation').focus();
    await page.keyboard.press('Enter');
    await expect(sidebar).toHaveClass(/open/);

    const toolsTab = page.getByRole('button', { name: /tools/i });
    await toolsTab.focus();
    await page.keyboard.press('ArrowDown');

    const toolsMenu = page.getByRole('menu', { name: /tools/i });
    const firstTool = toolsMenu.getByRole('menuitem').first();
    await expect(toolsMenu).toBeVisible();
    await expect(firstTool).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(toolsMenu).toHaveCount(0);
    await expect(toolsTab).toBeFocused();
  });

  test('navigates lessons, toggles completion, and submits a quiz', async ({ page }) => {
    await expect(page.locator('.lesson-title')).toBeVisible();
    const initialTitle = await page.locator('.lesson-title').textContent();

    await page.getByLabel('Toggle lesson notes').click();
    await expect(page.locator('.notes-panel')).toBeVisible();
    await page.getByLabel('Toggle lesson notes').click();
    await expect(page.locator('.notes-panel')).toHaveCount(0);

    const doneButton = page.locator('.lesson-nav-done');
    const getDoneState = async () =>
      (await doneButton.getAttribute('aria-pressed')) === 'true';

    const previousDoneState = await getDoneState();
    await doneButton.click();
    await expect.poll(getDoneState).toBe(!previousDoneState);

    await page.locator('.lesson-nav-next').click();
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

  test('keeps lesson notes reachable while focused on mobile', async ({ page }) => {
    await expect(page.locator('.lesson-title')).toBeVisible();
    await page.getByLabel('Toggle lesson notes').click();

    const notesPanel = page.locator('.notes-panel');
    await expect(notesPanel).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const notesInput = page.getByRole('textbox', { name: /lesson notes/i });
    await notesInput.fill('Mobile note reachability check');
    await notesInput.focus();
    await expectControlAboveBottomNavigation(page, notesInput);

    await expect(page.locator('.notes-saved')).toBeVisible();
  });
});
