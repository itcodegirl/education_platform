import { expect, test } from '@playwright/test';
import { getAuthSkipReason, getMissingAuthEnv } from './authE2E.js';
import {
  dismissWelcomeOverlay,
  signInIfAuthScreen,
  throwIfAuthTerminalState,
  waitForLearningShell,
} from './authHelpers.js';

const missingEnv = getMissingAuthEnv();

test.describe('authenticated resume-next guidance', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable authenticated resume-next tests.`,
  );

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'authenticated-chromium',
      'Authenticated resume-next coverage runs once on desktop Chromium.',
    );
    const authSkipReason = getAuthSkipReason();
    test.skip(Boolean(authSkipReason), authSkipReason);

    await page.addInitScript(() => {
      window.localStorage.setItem('chw-onboarded', 'true');
      window.localStorage.removeItem('chw-lock-mode');
    });
  });

  test('shows one actionable next-step recommendation inside the signed-in lesson shell', async ({ page }) => {
    await page.goto('/learn/html/101/lesson-01');
    await signInIfAuthScreen(page);
    await waitForLearningShell(page);
    await dismissWelcomeOverlay(page);
    await throwIfAuthTerminalState(page);

    const recommendation = page.getByRole('region', { name: 'Recommended next step' });
    await expect(recommendation).toBeVisible({ timeout: 30000 });
    await expect(recommendation.getByRole('heading')).toBeVisible();

    const actions = recommendation.getByRole('button');
    await expect(actions).toHaveCount(1);
    await expect(actions.first()).toBeEnabled();
  });
});
