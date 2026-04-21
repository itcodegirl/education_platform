import { expect, test } from '@playwright/test';

test.describe('public auth shell', () => {
  test('renders the login experience', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });

    await expect(page.locator('.auth-brand')).toContainText('CodeHerWay');
    await expect(page.getByText(/Learn\.\s*Build\.\s*Ship\./i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('switches into sign-up mode cleanly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(async () => {
      await page.getByRole('button', { name: 'Sign Up' }).click();
      await expect(page.getByLabel('Display Name')).toBeVisible();
    }).toPass({ timeout: 15000 });

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });
});
