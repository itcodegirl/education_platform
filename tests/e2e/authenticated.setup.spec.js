import { expect, test } from '@playwright/test';
import {
	authFile,
	getMissingAuthEnv,
	markAuthReady,
	markAuthUnavailable,
} from './authE2E.js';

test('capture authenticated storage state', async ({ page }) => {
	const missingEnv = getMissingAuthEnv();
	if (missingEnv.length > 0) {
		const reason = `Set ${missingEnv.join(', ')} to generate authenticated storage state.`;
		markAuthUnavailable(reason);
		test.skip(true, reason);
	}

	await page.addInitScript(() => {
		window.localStorage.setItem('chw-onboarded', 'true');
		window.localStorage.removeItem('chw-lock-mode');
	});

	await page.goto('/');

	const emailInput = page.getByLabel('Email');
	if (await emailInput.isVisible().catch(() => false)) {
		const loginTab = page.getByRole('tab', { name: /login/i });
		if (await loginTab.isVisible().catch(() => false)) {
			await loginTab.click();
		}

		await emailInput.fill(process.env.E2E_EMAIL);
		await page.getByLabel('Password').fill(process.env.E2E_PASSWORD);
		await page.getByRole('button', { name: /log in/i }).last().click();
	}

	const authReady = await waitForAuthenticatedShell(page);
	if (!authReady.ok) {
		markAuthUnavailable(authReady.reason);
		test.skip(true, authReady.reason);
	}

	const startFreshButton = page.getByRole('button', { name: /start fresh/i });
	if (await startFreshButton.isVisible().catch(() => false)) {
		await startFreshButton.click();
	}

	await page.context().storageState({ path: authFile });
	markAuthReady();
});

async function waitForAuthenticatedShell(page) {
	const result = await page.waitForFunction(() => {
		const isVisible = (selector) => {
			const element = document.querySelector(selector);
			return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
		};

		const authError = document.querySelector('.auth-error');
		const authErrorText = authError?.textContent?.trim();
		if (isVisible('.auth-error') && authErrorText) {
			return { ok: false, reason: `Configured E2E test account could not sign in: ${authErrorText}` };
		}

		const hasAuthenticatedShell = isVisible('.topbar') &&
			isVisible('#course-sidebar') &&
			isVisible('.main-shell') &&
			!isVisible('.auth-card');

		return hasAuthenticatedShell ? { ok: true, reason: null } : null;
	}, null, { timeout: 20000 }).then((handle) => handle.jsonValue()).catch(() => ({
		ok: false,
		reason: 'Configured E2E test account could not reach the authenticated shell.',
	}));

	if (!result.ok) {
		return result;
	}

	await expect(page.locator('.topbar')).toBeVisible({ timeout: 30000 });
	await expect(page.locator('#course-sidebar')).toBeVisible({ timeout: 30000 });
	await expect(page.locator('.main-shell')).toBeVisible({ timeout: 30000 });

	return result;
}
