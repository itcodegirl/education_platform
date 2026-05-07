import { expect, test } from '@playwright/test';
import {
	authFile,
	getMissingAuthEnv,
	markAuthReady,
	markAuthUnavailable,
} from './authE2E.js';
import { signInIfAuthScreen } from './authHelpers.js';

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
	await signInIfAuthScreen(page);

	const authReady = await waitForAuthenticatedShell(page);
	if (!authReady.ok) {
		markAuthUnavailable(authReady.reason);
		throw new Error(authReady.reason);
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

		if (isVisible('.conn-error')) {
			return { ok: false, reason: 'Configured E2E test account reached the connection error screen after login.' };
		}

		if (isVisible('.disabled-screen')) {
			const disabledText = document.querySelector('.disabled-screen')?.textContent?.trim() || '';
			if (/could not verify your account/i.test(disabledText)) {
				return {
					ok: false,
					reason: 'Configured E2E test account signed in, but its profile could not be verified. Check the E2E profiles row and profile RLS policies.',
				};
			}
			return { ok: false, reason: 'Configured E2E test account is signed in but disabled.' };
		}

		if (isVisible('.eb-screen')) {
			const detail = document.querySelector('.eb-detail code')?.textContent?.trim();
			return {
				ok: false,
				reason: `Configured E2E test account hit the app error boundary.${detail ? ` Detail: ${detail}` : ''}`,
			};
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
