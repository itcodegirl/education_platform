import { expect, test } from '@playwright/test';

const VISUAL_VIEWPORTS = [
	{ width: 320, height: 568 },
	{ width: 360, height: 780 },
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
	{ width: 768, height: 1024 },
];

async function openPreviewLesson(page) {
	await page.goto('/');
	await expect(page.getByRole('button', { name: /preview (the first )?lesson/i })).toBeVisible({ timeout: 30000 });
	await page.getByRole('button', { name: /preview (the first )?lesson/i }).click();
	await expect(page.getByText(/Preview Mode/i)).toBeVisible({ timeout: 15000 });
}

test.describe('public visual regression', () => {
	test.skip(
		Boolean(process.env.CI),
		'Visual snapshots use platform-specific baselines; run locally when updating snapshots.'
	);
	test.beforeEach(async ({ page }, testInfo) => {
		void page;
		test.skip(
			testInfo.project.name !== 'mobile-chrome',
			'Public mobile snapshots are maintained in mobile Chrome only.',
		);
	});

	for (const viewport of VISUAL_VIEWPORTS) {
		const viewportLabel = `${viewport.width}x${viewport.height}`;

		test(`landing auth card at ${viewportLabel}`, async ({ page }) => {
			await page.setViewportSize(viewport);
			await page.goto('/');
			await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
			await expect(page.locator('.auth-card')).toHaveScreenshot(`public-auth-card-${viewportLabel}.png`, {
				animations: 'disabled',
				timeout: 15000,
				maxDiffPixelRatio: 0.03,
			});
		});

		test(`preview lesson at ${viewportLabel}`, async ({ page }) => {
			await page.setViewportSize(viewport);
			await openPreviewLesson(page);
			await expect(page.locator('.guest-preview')).toHaveScreenshot(`public-preview-${viewportLabel}.png`, {
				animations: 'disabled',
				timeout: 15000,
				maxDiffPixelRatio: 0.04,
			});
		});
	}
});
