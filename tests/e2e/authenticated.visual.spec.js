import { expect, test } from '@playwright/test';

const requiredEnv = [
	'VITE_SUPABASE_URL',
	'VITE_SUPABASE_ANON_KEY',
	'E2E_EMAIL',
	'E2E_PASSWORD',
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

async function closeTransientOverlays(page) {
	const startFreshButton = page.getByRole('button', { name: /start fresh/i });
	if (await startFreshButton.isVisible().catch(() => false)) {
		await startFreshButton.click();
	}

	const dismissButton = page.locator('.welcome-dismiss, .whatsnew-close, .cheatsheet-close').first();
	if (await dismissButton.isVisible().catch(() => false)) {
		await dismissButton.click();
	}

	await page.keyboard.press('Escape').catch(() => { });
}

async function ensureSidebarOpen(page) {
	const openNav = page.getByLabel('Open course navigation');
	if (await openNav.isVisible().catch(() => false)) {
		await openNav.click();
		await expect(page.locator('#course-sidebar.open')).toBeVisible();
	} else {
		await expect(page.locator('#course-sidebar')).toBeVisible();
	}
}

test.describe('authenticated visual regression', () => {
	test.skip(
		missingEnv.length > 0,
		`Set ${missingEnv.join(', ')} to enable authenticated visual snapshots.`
	);

	test('shell + sidebar at 390 width', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await expect(page.locator('.topbar')).toBeVisible({ timeout: 30000 });

		await closeTransientOverlays(page);
		await ensureSidebarOpen(page);

		await expect(page).toHaveScreenshot('auth-shell-sidebar-390x844.png', {
			animations: 'disabled',
		});
	});

	test('shell + sidebar at 360 width', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 780 });
		await page.goto('/');
		await expect(page.locator('.topbar')).toBeVisible({ timeout: 30000 });

		await closeTransientOverlays(page);
		await ensureSidebarOpen(page);

		await expect(page).toHaveScreenshot('auth-shell-sidebar-360x780.png', {
			animations: 'disabled',
		});
	});

	test('glossary panel modal at 390 width', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await expect(page.locator('.topbar')).toBeVisible({ timeout: 30000 });

		await closeTransientOverlays(page);
		await page.getByRole('button', { name: /open glossary/i }).click();
		await expect(page.getByRole('heading', { name: /glossary/i })).toBeVisible();

		await expect(page).toHaveScreenshot('auth-glossary-390x844.png', {
			animations: 'disabled',
		});
	});

	test('admin users pagination at 390 width', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/admin');

		if (await page.getByRole('heading', { name: /access denied/i }).isVisible().catch(() => false)) {
			test.skip(true, 'Authenticated user is not an admin in this environment.');
		}

		await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible({ timeout: 30000 });
		await page.getByRole('tab', { name: /users/i }).click();
		await expect(page.getByRole('navigation', { name: /users pagination/i })).toBeVisible();

		await expect(page).toHaveScreenshot('auth-admin-users-390x844.png', {
			animations: 'disabled',
		});
	});
});
