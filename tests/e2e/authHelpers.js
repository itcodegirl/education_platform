import { expect } from '@playwright/test';

export async function loginWithCredentials(page, { email, password }) {
  const loginTab = page.getByRole('tab', { name: /^login$/i });
  if (await loginTab.isVisible().catch(() => false)) {
    await loginTab.click();
    await expect(loginTab).toHaveAttribute('aria-selected', 'true', { timeout: 10000 });
  }

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);

  const loginButton = page.locator('form.auth-form button[type="submit"]').first();
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await expect(loginButton).toContainText(/log in/i, { timeout: 10000 });
  await loginButton.click();
}

export async function waitForLearningShell(page, { timeout = 30000 } = {}) {
  await page.waitForSelector(
    '.main-shell, .welcome-overlay, .auth-error, .conn-error, .disabled-screen, .eb-screen',
    { timeout },
  );
  await throwIfAuthTerminalState(page);
}

export async function dismissWelcomeOverlay(page, { timeout = 10000 } = {}) {
  const welcomeVisible = await page.locator('.welcome-overlay').isVisible().catch(() => false);
  if (!welcomeVisible) return;

  await page.click('.welcome-dismiss, .welcome-resume-btn');
  await waitForLearningShell(page, { timeout });
}

export async function throwIfAuthTerminalState(page) {
  const authErrorText = await page.locator('.auth-error').textContent().catch(() => '');
  if (authErrorText?.trim()) {
    throw new Error(`E2E login failed: ${authErrorText.trim()}`);
  }

  if (await page.locator('.conn-error').isVisible().catch(() => false)) {
    throw new Error('E2E login reached the connection error screen.');
  }

  if (await page.locator('.disabled-screen').isVisible().catch(() => false)) {
    throw new Error('E2E user signed in but the account is disabled.');
  }

  if (await page.locator('.eb-screen').isVisible().catch(() => false)) {
    const detail = await page.locator('.eb-detail code').textContent().catch(() => '');
    throw new Error(`E2E login hit the app error boundary.${detail ? ` Detail: ${detail}` : ''}`);
  }
}
