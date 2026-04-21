import fs from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';

const authDir = path.join(process.cwd(), 'playwright', '.auth');
const authFile = path.join(authDir, 'user.json');

const requiredEnv = [
	'VITE_SUPABASE_URL',
	'VITE_SUPABASE_ANON_KEY',
	'E2E_EMAIL',
	'E2E_PASSWORD',
];

function writeEmptyState() {
	fs.mkdirSync(authDir, { recursive: true });
	fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
}

test('capture authenticated storage state', async ({ page }) => {
	const missingEnv = requiredEnv.filter((name) => !process.env[name]);
	if (missingEnv.length > 0) {
		writeEmptyState();
		test.skip(true, `Set ${missingEnv.join(', ')} to generate authenticated storage state.`);
	}

	await page.goto('/');

	const emailInput = page.getByLabel('Email');
	if (await emailInput.isVisible().catch(() => false)) {
		await emailInput.fill(process.env.E2E_EMAIL);
		await page.getByLabel('Password').fill(process.env.E2E_PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).last().click();
	}

	await page.waitForSelector('.topbar, .shell', { timeout: 30000 });

	const startFreshButton = page.getByRole('button', { name: /start fresh/i });
	if (await startFreshButton.isVisible().catch(() => false)) {
		await startFreshButton.click();
	}

	fs.mkdirSync(authDir, { recursive: true });
	await page.context().storageState({ path: authFile });
});
