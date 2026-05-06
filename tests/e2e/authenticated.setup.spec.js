import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getMissingE2EAuthConfig, loginWithCredentials, throwIfAuthTerminalState } from './authHelpers';

const authDir = path.join(process.cwd(), 'playwright', '.auth');
const authFile = path.join(authDir, 'user.json');

function writeEmptyState() {
	fs.mkdirSync(authDir, { recursive: true });
	fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
}

test('capture authenticated storage state', async ({ page }) => {
	test.setTimeout(90000);

	const missingEnv = getMissingE2EAuthConfig();
	if (missingEnv.length > 0) {
		writeEmptyState();
		test.skip(true, `Set ${missingEnv.join(', ')} to generate authenticated storage state.`);
	}

	await page.addInitScript(() => {
		window.localStorage.setItem('chw-onboarded', 'true');
		window.localStorage.removeItem('chw-lock-mode');
	});

	await page.goto('/');

	const emailInput = page.getByLabel('Email');
	if (await emailInput.isVisible().catch(() => false)) {
		await loginWithCredentials(page, {
			email: process.env.E2E_EMAIL,
			password: process.env.E2E_PASSWORD,
		});
	}

	await waitForAuthenticatedShell(page);

	const startFreshButton = page.getByRole('button', { name: /start fresh/i });
	if (await startFreshButton.isVisible().catch(() => false)) {
		await startFreshButton.click();
	}

	fs.mkdirSync(authDir, { recursive: true });
	await page.context().storageState({ path: authFile });
});

async function waitForAuthenticatedShell(page) {
	try {
		await page.waitForFunction(() => {
			const isVisible = (selector) => {
				const element = document.querySelector(selector);
				return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
			};

			const terminalState = ['.auth-error', '.conn-error', '.disabled-screen', '.eb-screen'].some(isVisible);
			const leftAuthScreen = !isVisible('.auth-card');
			const appReady = isVisible('.main-shell') || isVisible('.welcome-overlay') || isVisible('.loading-screen');

			return terminalState || (leftAuthScreen && appReady);
		}, null, { timeout: 60000 });
	} catch (error) {
		await throwIfAuthTerminalState(page);
		throw error;
	}

	await throwIfAuthTerminalState(page);

	await expect(page.locator('.auth-card')).toBeHidden({ timeout: 10000 });
	await expect(page.locator('.main-shell, .welcome-overlay, .loading-screen')).toBeVisible({ timeout: 10000 });
}
