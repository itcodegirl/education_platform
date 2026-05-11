import { expect, test } from '@playwright/test';
import { expectNoBlockingAxeViolations } from './a11yAssertions.js';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function waitForAuthenticatedShell(page) {
  await page.waitForFunction(() => {
    const isVisible = (selector) => {
      const element = document.querySelector(selector);
      return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
    };

    return isVisible('.topbar')
      && isVisible('#course-sidebar')
      && isVisible('.main-shell')
      && !isVisible('.auth-card');
  }, null, { timeout: 30000 });

  await expect(page.locator('.topbar')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#course-sidebar')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.main-shell')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.lesson-title')).toBeVisible({ timeout: 30000 });
}

async function dismissTransientUi(page) {
  const startFreshButton = page.getByRole('button', { name: /start fresh/i });
  if (await startFreshButton.isVisible().catch(() => false)) {
    await startFreshButton.click();
  }

  const whatsNewDialog = page.locator('.search-modal.wn-modal');
  if (await whatsNewDialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
  }
}

async function signInIfNeeded(page) {
  const emailInput = page.getByLabel('Email');
  if (!(await emailInput.isVisible().catch(() => false))) return;

  await emailInput.fill(process.env.E2E_EMAIL);
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: /log in/i }).last().click();
}

async function ensureLessonQuizVisible(page, maxSteps = 6) {
  const quizHeading = page.getByRole('heading', { name: /quick check/i });
  const nextButton = page
    .getByRole('navigation', { name: /lesson pagination/i })
    .getByRole('button', { name: /next/i });

  for (let step = 0; step <= maxSteps; step += 1) {
    if (await quizHeading.isVisible().catch(() => false)) return true;
    if (!(await nextButton.isEnabled().catch(() => false))) return false;

    const currentTitle = await page.locator('.lesson-title').textContent();
    await nextButton.click();
    await expect(page.locator('.lesson-title')).not.toHaveText(currentTitle || '');
  }

  return false;
}

test.describe('authenticated accessibility', () => {
  test.setTimeout(120000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable the authenticated accessibility tests.`,
  );

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'authenticated-chromium',
      'Authenticated accessibility currently runs on desktop Chromium only.',
    );

    await page.addInitScript(() => {
      window.localStorage.setItem('chw-onboarded', 'true');
      window.localStorage.removeItem('chw-lock-mode');
    });

    await page.goto('/');
    await signInIfNeeded(page);
    await waitForAuthenticatedShell(page);
    await dismissTransientUi(page);
  });

  test('signed-in lesson shell has no serious axe violations', async ({ page }) => {
    await expectNoBlockingAxeViolations(page);
  });

  test('search modal restores focus and supports keyboard result selection', async ({ page }) => {
    const searchTrigger = page.getByRole('button', { name: /open lesson search/i });

    await searchTrigger.focus();
    await page.keyboard.press('Enter');

    const searchDialog = page.getByRole('dialog', { name: /search lessons/i });
    const searchInput = page.getByRole('combobox', { name: /search lessons/i });

    await expect(searchDialog).toBeVisible();
    await expect(searchInput).toBeFocused();
    await expectNoBlockingAxeViolations(page);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /search lessons/i })).toHaveCount(0);
    await expect(searchTrigger).toBeFocused();

    await searchTrigger.focus();
    await page.keyboard.press('Enter');
    await expect(searchInput).toBeFocused();
    await searchInput.fill('html');
    await expect(page.getByRole('option').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: /search lessons/i })).toHaveCount(0);
    await expect(page).toHaveURL(/\/learn\/[^/]+\/[^/]+\/[^/]+/);
  });

  test('mobile sidebar drawer restores focus after keyboard close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await waitForAuthenticatedShell(page);
    await dismissTransientUi(page);

    const navTrigger = page.getByRole('button', { name: /open course navigation/i });
    await navTrigger.focus();
    await page.keyboard.press('Enter');

    const drawer = page.getByRole('dialog', { name: /course navigation/i });
    await expect(drawer).toBeVisible();
    await expect(drawer).toBeFocused();
    await expectNoBlockingAxeViolations(page);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /course navigation/i })).toHaveCount(0);
    await expect(navTrigger).toBeFocused();
  });

  test('bookmark and notes controls remain keyboard-accessible for signed-in learners', async ({ page }) => {
    const lessonTitle = ((await page.locator('.lesson-title').textContent()) || '').trim();
    const bookmarkButton = page.getByRole('button', { name: /bookmark this lesson|remove bookmark/i });
    const bookmarkLabel = (await bookmarkButton.getAttribute('aria-label')) || '';

    if (/bookmark this lesson/i.test(bookmarkLabel)) {
      await bookmarkButton.focus();
      await page.keyboard.press('Enter');
      await expect(bookmarkButton).toHaveAttribute('aria-label', /remove bookmark/i);
    }

    const notesTrigger = page.getByRole('button', { name: /toggle lesson notes/i });
    await notesTrigger.focus();
    await page.keyboard.press('Enter');

    const notesField = page.getByRole('textbox', { name: /lesson notes/i });
    await expect(notesField).toBeVisible();
    await notesField.fill('Keyboard note for accessibility coverage.');
    await expect(notesField).toHaveValue('Keyboard note for accessibility coverage.');

    const bookmarksTrigger = page.getByRole('button', { name: /open bookmarks/i });
    await bookmarksTrigger.focus();
    await page.keyboard.press('Enter');

    const bookmarksDialog = page.getByRole('dialog', { name: /bookmarks \(/i });
    await expect(bookmarksDialog).toBeVisible();
    await expectNoBlockingAxeViolations(page);

    if (lessonTitle) {
      await expect(
        page.getByRole('button', {
          name: new RegExp(`Open ${escapeRegExp(lessonTitle)}`, 'i'),
        }),
      ).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /bookmarks \(/i })).toHaveCount(0);
    await expect(bookmarksTrigger).toBeFocused();
  });

  test('lesson quiz answers remain keyboard-usable when a quick check is present', async ({ page }) => {
    const quizVisible = await ensureLessonQuizVisible(page);
    test.skip(!quizVisible, 'No visible lesson quiz found within the first few lessons.');

    const quiz = page.locator('.quiz-container').first();
    const firstOption = quiz.getByRole('radio').first();
    const submitButton = quiz.getByRole('button', { name: /submit answers/i });

    await firstOption.focus();
    await page.keyboard.press('Space');
    await expect(submitButton).toBeEnabled();
    await submitButton.focus();
    await page.keyboard.press('Enter');

    await expect(
      quiz.getByText(/best score saved to your progress|xp already earned/i),
    ).toBeVisible();
    await expect(quiz.getByText(/next step:/i)).toBeVisible();
  });
});
