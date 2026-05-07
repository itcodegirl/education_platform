import { expect } from '@playwright/test';

const REQUIRED_AUTH_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const LOCAL_SUPABASE_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;
const PLACEHOLDER_SUPABASE_ANON_KEY = 'example-anon-key';

export function isE2EAuthRequired(env = process.env) {
  return env.E2E_AUTH_REQUIRED === 'true' || env.CI === 'true';
}

export function getMissingE2EAuthConfig(env = process.env) {
  const missing = REQUIRED_AUTH_ENV.filter((name) => !env[name]);
  const allowLocalSupabase = env.E2E_ALLOW_LOCAL_SUPABASE === 'true';
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || '';

  if (isE2EAuthRequired(env) && !allowLocalSupabase && LOCAL_SUPABASE_URL.test(supabaseUrl)) {
    missing.push('VITE_SUPABASE_URL');
  }

  if (isE2EAuthRequired(env) && supabaseAnonKey === PLACEHOLDER_SUPABASE_ANON_KEY) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  return [...new Set(missing)];
}

export async function waitForAuthEntryOrShell(page, { timeout = 30000 } = {}) {
  await page.waitForSelector(
    '.topbar, .auth-card, .auth-error, .conn-error, .disabled-screen, .eb-screen',
    { timeout },
  );
}

export async function loginWithCredentials(page, { email, password }) {
  const loginTab = page.locator('.auth-tabs [role="tab"]').filter({ hasText: /^Login$/i }).first();
  await expect(loginTab).toBeVisible({ timeout: 10000 });
  await loginTab.click();
  await expect(loginTab).toHaveAttribute('aria-selected', 'true', { timeout: 10000 });

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);

  const loginButton = page.locator('form.auth-form button[type="submit"]').first();
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await expect(loginButton).toContainText(/log in/i, { timeout: 10000 });
  await loginButton.click();
}

export async function signInIfAuthScreen(page, {
  email = process.env.E2E_EMAIL,
  password = process.env.E2E_PASSWORD,
  timeout = 30000,
} = {}) {
  await waitForAuthEntryOrShell(page, { timeout });

  if (!(await page.locator('.auth-card').isVisible().catch(() => false))) {
    return false;
  }

  await loginWithCredentials(page, { email, password });
  return true;
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
    const disabledText = await page.locator('.disabled-screen').textContent().catch(() => '');
    if (/could not verify your account/i.test(disabledText || '')) {
      throw new Error('E2E user signed in, but the profile could not be verified. Check the E2E profiles row and profile RLS policies.');
    }
    throw new Error('E2E user signed in but the account is disabled.');
  }

  if (await page.locator('.eb-screen').isVisible().catch(() => false)) {
    const detail = await page.locator('.eb-detail code').textContent().catch(() => '');
    throw new Error(`E2E login hit the app error boundary.${detail ? ` Detail: ${detail}` : ''}`);
  }
}
