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

  async function expectWithinViewport(page, locator, label) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    const viewport = page.viewportSize();

    expect(box, `${label} should have a layout box`).toBeTruthy();
    expect(box.x, `${label} should not overflow left`).toBeGreaterThanOrEqual(0);
    expect(box.y, `${label} should not overflow top`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${label} should not overflow right`).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height, `${label} should not overflow bottom`).toBeLessThanOrEqual(viewport.height + 1);
  }

  async function expectMobileLessonNavReady(page) {
    const lessonNav = page.locator('.lesson-nav');
    await expect(lessonNav).toBeVisible();
    await expect(lessonNav).toHaveCSS('position', 'fixed');

    const navBox = await lessonNav.boundingBox();
    const viewport = page.viewportSize();
    expect(navBox, 'mobile lesson navigation should be measurable').toBeTruthy();
    expect(navBox.y, 'mobile lesson navigation should stay in thumb reach at the bottom').toBeGreaterThan(
      viewport.height * 0.72,
    );

    for (const button of await page.locator('.lesson-nav-btn').all()) {
      const box = await button.boundingBox();
      expect(box?.height || 0, 'mobile lesson nav buttons should remain thumb-sized').toBeGreaterThanOrEqual(44);
    }
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

  async function expectMinimumTouchTarget(locator) {
    const box = await locator.boundingBox();

    expect(box, 'touch target should have a layout box').toBeTruthy();
    expect(box?.width || 0, 'touch target should be at least 44px wide').toBeGreaterThanOrEqual(44);
    expect(box?.height || 0, 'touch target should be at least 44px tall').toBeGreaterThanOrEqual(44);
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
    await expectMobileLessonNavReady(page);
    await expectNoHorizontalOverflow(page);

    await page.getByLabel('Open course navigation').click();
    await expect(page.locator('#course-sidebar.open')).toBeVisible();

    await page.getByRole('button', { name: /tools/i }).click();
    await page.getByRole('menuitem', { name: /cheat sheets/i }).click();
    await expectWithinViewport(page, page.locator('.search-modal'), 'cheat sheet modal');

    await page.keyboard.press('Escape');
    const closeSidebar = page.getByLabel('Close sidebar');
    if (await closeSidebar.isVisible().catch(() => false)) {
      await closeSidebar.click();
    }

    await page.getByLabel('Open lesson search').click();
    await expect(page.locator('.search-input')).toBeVisible();
    await expectWithinViewport(page, page.locator('.search-modal'), 'search modal');
    await page.locator('.search-input').fill('layout');
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press('Escape');

    await page.getByLabel('Open learning tools').click();
    const toolsSheet = page.getByRole('dialog', { name: /learning tools/i });
    await expectWithinViewport(page, toolsSheet, 'mobile tools sheet');

    await toolsSheet.getByRole('button', { name: /challenges/i }).click();
    await expect(page.locator('.challenges-panel')).toBeVisible();
  });

  test('keeps mobile text entry controls clear of fixed chrome', async ({ page }) => {
    await expectMobileLessonNavReady(page);
    await expect(page.locator('.lesson-title')).toBeVisible();

    await page.getByLabel('Toggle lesson notes').click();
    const notesInput = page.getByRole('textbox', { name: /lesson notes/i });
    await notesInput.fill('Mobile keyboard overlap check');
    await notesInput.focus();
    await expectControlAboveBottomNavigation(page, notesInput);

    const codeEditor = page.getByRole('textbox', { name: /^code editor$/i }).first();
    if (await codeEditor.isVisible().catch(() => false)) {
      await codeEditor.focus();
      await expectControlAboveBottomNavigation(page, codeEditor);
    }

    await expectNoHorizontalOverflow(page);
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

    const focusStrip = page.getByRole('region', { name: /current lesson step/i });
    await expect(focusStrip).toBeVisible();
    await expect(focusStrip).toContainText(/read|save|evidence|quick check/i);

    await page.getByLabel('Toggle lesson notes').click();
    await expect(page.locator('.notes-panel')).toBeVisible();
    await page.getByLabel('Toggle lesson notes').click();
    await expect(page.locator('.notes-panel')).toHaveCount(0);

    const doneButton = page.locator('.lesson-nav-done');
    await expect(doneButton).toHaveAccessibleName(/complete lesson|completed/i);
    await expectMinimumTouchTarget(doneButton);
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
