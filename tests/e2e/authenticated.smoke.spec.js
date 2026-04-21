import { expect, test } from '@playwright/test';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

test.describe.skip('authenticated smoke', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable the authenticated smoke tests.`
  );

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-chrome',
      'Authenticated smoke currently runs on desktop Chromium only.'
    );

    const diagnostics = {
      consoleErrors: [],
      pageErrors: [],
    };

    page.on('console', (message) => {
      if (message.type() === 'error') {
        diagnostics.consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      diagnostics.pageErrors.push(error.message);
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('chw-onboarded', 'true');
      window.localStorage.removeItem('chw-lock-mode');
    });

    await page.goto('/');

    if (await page.getByLabel('Email').isVisible().catch(() => false)) {
      await page.getByLabel('Email').fill(process.env.E2E_EMAIL);
      await page.getByLabel('Password').fill(process.env.E2E_PASSWORD);
      await page.getByRole('button', { name: 'Log In' }).last().click();
    }

    await waitForAuthenticatedShell(page, diagnostics);

    const startFreshButton = page.getByRole('button', { name: /start fresh/i });
    if (await startFreshButton.isVisible().catch(() => false)) {
      await startFreshButton.click();
    }
  });

  test('opens glossary from the bottom toolbar', async ({ page }) => {
    await page.getByRole('button', { name: 'Open glossary' }).click();

    await expect(page.getByRole('heading', { name: /Glossary/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search terms...')).toBeVisible();
  });

  test('opens bookmarks from the bottom toolbar', async ({ page }) => {
    await page.getByRole('button', { name: 'Open bookmarks' }).click();

    await expect(page.getByRole('heading', { name: /Bookmarks/i })).toBeVisible();
  });

  test('opens the sidebar from the top bar', async ({ page }) => {
    const navButton = page.getByLabel('Open course navigation');

    if (await navButton.isVisible().catch(() => false)) {
      await navButton.click();
      await expect(page.locator('#course-sidebar.open')).toBeVisible();
    } else {
      await expect(page.locator('#course-sidebar')).toBeVisible();
    }
  });
});

async function waitForAuthenticatedShell(page, diagnostics) {
  const shellSelectors = ['.topbar', '#course-sidebar', '.mn', '.bottom-tools'];
  const terminalSelectors = ['.auth-error', '.conn-error', '.disabled-screen', '.eb-screen'];

  try {
    await page.waitForFunction(({ shellSelectors, terminalSelectors }) => {
      const isVisible = (selector) => {
        const element = document.querySelector(selector);
        return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
      };

      const hasTerminalState = terminalSelectors.some(isVisible);
      const hasAuthenticatedShell = shellSelectors.every(isVisible);

      return hasTerminalState || hasAuthenticatedShell;
    }, { shellSelectors, terminalSelectors }, { timeout: 30000 });
  } catch (error) {
    const terminalError = await getTerminalStateError(page);
    if (terminalError) throw terminalError;

    const runtimeErrors = getBlockingRuntimeErrors(diagnostics);
    if (runtimeErrors.length > 0) {
      throw new Error(`Authenticated smoke saw runtime errors after login: ${runtimeErrors.slice(0, 3).join(' | ')}`);
    }

    if (await page.locator('.auth-card').isVisible().catch(() => false)) {
      throw new Error('Authenticated smoke is still on the auth screen after attempting login.');
    }

    throw error;
  }

  const terminalError = await getTerminalStateError(page);
  if (terminalError) throw terminalError;

  const runtimeErrors = getBlockingRuntimeErrors(diagnostics);
  if (runtimeErrors.length > 0) {
    throw new Error(`Authenticated smoke saw runtime errors after login: ${runtimeErrors.slice(0, 3).join(' | ')}`);
  }

  await expect(page.locator('.topbar')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#course-sidebar')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.mn')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.bottom-tools')).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Open bookmarks' })).toBeVisible({ timeout: 30000 });
}

async function getTerminalStateError(page) {
  const authErrorText = await page.locator('.auth-error').textContent().catch(() => '');
  if (authErrorText?.trim()) {
    return new Error(`Authenticated smoke login failed: ${authErrorText.trim()}`);
  }

  if (await page.locator('.conn-error').isVisible().catch(() => false)) {
    return new Error('Authenticated smoke reached the connection error screen after login.');
  }

  if (await page.locator('.disabled-screen').isVisible().catch(() => false)) {
    return new Error('Authenticated smoke user is signed in but the account is disabled.');
  }

  if (await page.locator('.eb-screen').isVisible().catch(() => false)) {
    const detail = await page.locator('.eb-detail code').textContent().catch(() => '');
    return new Error(`Authenticated smoke hit the app error boundary.${detail ? ` Detail: ${detail}` : ''}`);
  }

  return null;
}

function getBlockingRuntimeErrors(diagnostics) {
  return [...diagnostics.pageErrors, ...diagnostics.consoleErrors]
    .filter(Boolean)
    .filter((message) => !/Failed to load resource/i.test(message));
}
