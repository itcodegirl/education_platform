import { expect, test } from '@playwright/test';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

test.describe('authenticated smoke', () => {
  test.setTimeout(90000);

  test.skip(
    missingEnv.length > 0,
    `Set ${missingEnv.join(', ')} to enable the authenticated smoke tests.`
  );

  test.beforeEach(async ({ page }) => {
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

    await waitForAuthenticatedShell(page);

    const startFreshButton = page.getByRole('button', { name: 'Start fresh' });
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

async function waitForAuthenticatedShell(page) {
  await page.waitForFunction(() => {
    const authError = document.querySelector('.auth-error');
    const connectionError = document.querySelector('.conn-error');
    const appToolbar = document.querySelector('.bottom-tools');
    return Boolean(authError || connectionError || appToolbar);
  }, { timeout: 60000 });

  const authErrorText = await page.locator('.auth-error').textContent().catch(() => '');
  if (authErrorText?.trim()) {
    throw new Error(`Authenticated smoke login failed: ${authErrorText.trim()}`);
  }

  if (await page.locator('.conn-error').isVisible().catch(() => false)) {
    throw new Error('Authenticated smoke reached the connection error screen after login.');
  }

  await expect(page.locator('.bottom-tools')).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Open bookmarks' })).toBeVisible({ timeout: 60000 });
}
