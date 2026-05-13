import { expect, test } from '@playwright/test';
import { getAuthSkipReason, getMissingAuthEnv } from './authE2E.js';
import { signInIfAuthScreen } from './authHelpers.js';

const missingEnv = getMissingAuthEnv();

test.describe('authenticated smoke', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable the authenticated smoke tests.`
  );

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'authenticated-chromium',
      'Authenticated smoke currently runs on desktop Chromium only.'
    );
    const authSkipReason = getAuthSkipReason();
    test.skip(Boolean(authSkipReason), authSkipReason);

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
    await signInIfAuthScreen(page);

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

  test('saved lessons render unavailable legacy rows without breaking the shell', async ({ page, request }) => {
    const session = await signInForSupabaseRest(request);
    const legacyBookmark = {
      user_id: session.user.id,
      lesson_key: `legacy-archived-${Date.now()}`,
      course_id: 'archived',
      lesson_title: 'Archived lesson',
    };

    await insertBookmarkRow(request, session.access_token, legacyBookmark);

    try {
      await page.reload();
      await waitForAuthenticatedShell(page, { consoleErrors: [], pageErrors: [] });

      await page.getByRole('button', { name: 'Open bookmarks' }).click();

      await expect(page.getByRole('heading', { name: /Bookmarks/i })).toBeVisible();
      await expect(page.getByText('Archived lesson')).toBeVisible();
      await expect(page.getByText('ARCHIVED > Saved lesson')).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: /archived lesson is unavailable in the current course catalog/i,
        }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: /remove bookmark for archived lesson/i }),
      ).toBeVisible();
    } finally {
      await deleteBookmarkRow(request, session.access_token, legacyBookmark);
    }
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

async function signInForSupabaseRest(request) {
  const response = await request.post(
    `${process.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: process.env.VITE_SUPABASE_ANON_KEY,
        'content-type': 'application/json',
      },
      data: {
        email: process.env.E2E_EMAIL,
        password: process.env.E2E_PASSWORD,
      },
    },
  );

  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

async function insertBookmarkRow(request, accessToken, bookmark) {
  const response = await request.post(`${process.env.VITE_SUPABASE_URL}/rest/v1/bookmarks`, {
    headers: {
      apikey: process.env.VITE_SUPABASE_ANON_KEY,
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    data: bookmark,
  });

  expect(response.ok(), await response.text()).toBe(true);
}

async function deleteBookmarkRow(request, accessToken, bookmark) {
  const query = new URLSearchParams({
    user_id: `eq.${bookmark.user_id}`,
    lesson_key: `eq.${bookmark.lesson_key}`,
  });
  await request.delete(`${process.env.VITE_SUPABASE_URL}/rest/v1/bookmarks?${query.toString()}`, {
    headers: {
      apikey: process.env.VITE_SUPABASE_ANON_KEY,
      authorization: `Bearer ${accessToken}`,
    },
  });
}

async function waitForAuthenticatedShell(page, diagnostics) {
  const shellSelectors = ['.topbar', '#course-sidebar', '.main-shell', '.bottom-tools'];
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
  await expect(page.locator('.main-shell')).toBeVisible({ timeout: 30000 });
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
    const disabledText = await page.locator('.disabled-screen').textContent().catch(() => '');
    if (/could not verify your account/i.test(disabledText || '')) {
      return new Error('Authenticated smoke user signed in, but the profile could not be verified. Check the E2E profiles row and profile RLS policies.');
    }
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
