import { expect, test } from '@playwright/test';

async function openPreviewLesson(page) {
	await page.goto('/');
	await expect(page.getByRole('button', { name: /preview a lesson first/i })).toBeVisible({ timeout: 30000 });
	await page.getByRole('button', { name: /preview a lesson first/i }).click();
	await expect(page.getByText(/Preview Mode/i)).toBeVisible({ timeout: 15000 });
}

test.describe('public visual regression', () => {
	test('landing at 390 width', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
		await expect(page.locator('.auth-card')).toHaveScreenshot('public-auth-card-390x844.png', {
			animations: 'disabled',
			timeout: 15000,
			maxDiffPixelRatio: 0.03,
		});
	});

	test('landing at 360 width', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 780 });
		await page.goto('/');
		await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
		await expect(page.locator('.auth-card')).toHaveScreenshot('public-auth-card-360x780.png', {
			animations: 'disabled',
			timeout: 15000,
			maxDiffPixelRatio: 0.03,
		});
	});

	test('preview lesson at 390 width', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await openPreviewLesson(page);
		await expect(page.locator('.guest-preview')).toHaveScreenshot('public-preview-390x844.png', {
			animations: 'disabled',
			timeout: 15000,
			maxDiffPixelRatio: 0.04,
		});
	});

	test('preview lesson at 360 width', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 780 });
		await openPreviewLesson(page);
		await expect(page.locator('.guest-preview')).toHaveScreenshot('public-preview-360x780.png', {
			animations: 'disabled',
			timeout: 15000,
			maxDiffPixelRatio: 0.04,
		});
	});
});
