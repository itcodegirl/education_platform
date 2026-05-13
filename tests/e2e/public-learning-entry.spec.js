import { expect, test } from '@playwright/test';

const PUBLIC_PHONE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

const PUBLIC_RESPONSIVE_VIEWPORTS = [
  ...PUBLIC_PHONE_VIEWPORTS,
  { width: 768, height: 1024 },
];

async function expectNoHorizontalOverflow(page) {
  const result = await page.evaluate(() => {
    const scrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0,
    );
    const viewportWidth = window.innerWidth;
    const offenders = Array.from(document.body.querySelectorAll('*'))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === 'string' ? node.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0,
        };
      })
      .filter((item) => item.visible && (item.left < -1 || item.right > viewportWidth + 1))
      .slice(0, 5);

    return {
      scrollWidth,
      viewportWidth,
      offenders,
    };
  });

  expect(
    result.scrollWidth,
    `Horizontal overflow at ${result.viewportWidth}px. Offenders: ${JSON.stringify(result.offenders)}`,
  ).toBeLessThanOrEqual(result.viewportWidth + 1);
}

async function expectTouchTarget(locator) {
  const box = await locator.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(44);
  expect(box?.height || 0).toBeGreaterThanOrEqual(44);
}

async function expectWithinViewport(locator, label) {
  const box = await locator.boundingBox();
  const viewport = locator.page().viewportSize();

  expect(box, `${label} should have a layout box`).not.toBeNull();
  expect(box.x, `${label} should not start off-screen`).toBeGreaterThanOrEqual(0);
  expect(box.y, `${label} should not start above the viewport`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${label} should fit within the viewport width`).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height, `${label} should fit within the viewport height`).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectNoVisibleControlOverlap(page, selector) {
  const result = await page.evaluate((controlSelector) => {
    const selectedControls = Array.from(document.querySelectorAll(controlSelector));
    const fallbackControls = Array.from(
      document.querySelectorAll('button, a, [role="button"], [role="tab"], input, textarea, select'),
    );
    const toVisibleControlBoxes = (nodes) => nodes
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return {
          label: node.getAttribute('aria-label') || node.textContent?.trim() || node.className || node.tagName,
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.width > 0
            && rect.height > 0,
        };
      })
      .filter((item) => item.visible);
    const scopedControls = selectedControls.length > 0 ? selectedControls : fallbackControls;
    const scopedVisibleControls = toVisibleControlBoxes(scopedControls);
    const controls = scopedVisibleControls.length > 0
      ? scopedVisibleControls
      : toVisibleControlBoxes(fallbackControls);

    const overlaps = [];
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const a = controls[i];
        const b = controls[j];
        const overlapsX = a.left < b.right && a.right > b.left;
        const overlapsY = a.top < b.bottom && a.bottom > b.top;
        if (overlapsX && overlapsY) {
          overlaps.push({ a: a.label, b: b.label });
        }
      }
    }

    return { count: controls.length, overlaps: overlaps.slice(0, 5) };
  }, selector);

  expect(result.count).toBeGreaterThan(0);
  expect(
    result.overlaps,
    `Overlapping controls detected: ${JSON.stringify(result.overlaps)}`,
  ).toEqual([]);
}

test.describe('public learner entry', () => {
  test('recovers stale lesson links to a useful course entry point', async ({ page }) => {
    await page.goto('/learn/html/missing-module/missing-lesson');

    await expect(page).toHaveURL(/\/learn\/html\/101\/lesson-01$/);
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /preview the first lesson/i })).toBeVisible();
  });

  test('opens the first lesson preview from the hero without an account', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('link', { name: /design system/i })).toHaveCount(0);

    await page.getByRole('button', { name: /preview the first lesson/i }).first().click();

    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Preview Mode/i)).toBeVisible();
    await expect(page.locator('.lesson-title')).toBeVisible();
    await expect(page.locator('.gp-cta')).toContainText(/track your progress/i);
    await expect(page.locator('.gp-cta')).toContainText(/save notes and bookmarks/i);

    await page.getByRole('button', { name: /create free account/i }).click();

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: /create account/i })).toBeVisible();
  });

  test('keeps preview actions reachable on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: /preview the first lesson/i }).first().click();

    const topbar = page.locator('.gp-topbar');
    await expect(topbar).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.lesson-surface')).toBeVisible();

    await expect(topbar).toHaveCSS('position', 'static');

    const createAccountButton = page.getByRole('button', { name: /create free account/i });
    await createAccountButton.scrollIntoViewIfNeeded();
    await expect(createAccountButton).toBeVisible();

    const buttonBox = await createAccountButton.boundingBox();
    const viewport = page.viewportSize();
    expect(buttonBox?.y).toBeGreaterThanOrEqual(0);
    expect((buttonBox?.y || 0) + (buttonBox?.height || 0)).toBeLessThanOrEqual(viewport.height);

    await createAccountButton.focus();
    await expect(createAccountButton).toBeFocused();
  });

  test('lets guests inspect the first lesson code output without an account', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /preview the first lesson/i }).first().click();
    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });

    const codePractice = page.locator('.code-preview').first();
    await expect(codePractice.getByRole('tablist', { name: /code practice views/i })).toBeVisible();
    await expect(codePractice.getByRole('tab', { name: /code/i })).toHaveAttribute('aria-selected', 'true');

    await codePractice.getByRole('tab', { name: /preview/i }).click();

    await expect(codePractice.getByTitle('HTML preview')).toBeVisible();
    await expect(codePractice.getByRole('tab', { name: /preview/i })).toHaveAttribute('aria-selected', 'true');
    await expectNoHorizontalOverflow(page);
  });

  test('mobilePublicLearnerFlowKeepsPreviewAndReturnPathUsable', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chrome',
      'Compact public learner flow is scoped to mobile Chrome.',
    );

    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expectNoHorizontalOverflow(page);

    const previewButton = page.getByRole('button', { name: /preview the first lesson/i }).first();
    await previewButton.scrollIntoViewIfNeeded();
    await expect(previewButton).toBeVisible();
    await expectTouchTarget(previewButton);
    await previewButton.click();

    await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
    await expectNoHorizontalOverflow(page);
    await expectNoVisibleControlOverlap(page, 'main button, main a');

    const lessonTitle = page.locator('.lesson-title').first();
    await lessonTitle.scrollIntoViewIfNeeded();
    await expect(lessonTitle).toBeVisible();
    await expectWithinViewport(lessonTitle, 'preview lesson title');

    const codePractice = page.locator('.code-preview').first();
    const previewTab = codePractice.getByRole('tab', { name: /preview/i });
    await previewTab.scrollIntoViewIfNeeded();
    await expect(previewTab).toBeVisible();
    await expectTouchTarget(previewTab);
    await previewTab.click();

    await expect(codePractice.getByTitle('HTML preview')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const createAccountButton = page.getByRole('button', { name: /create free account/i });
    await createAccountButton.scrollIntoViewIfNeeded();
    await expect(createAccountButton).toBeVisible();
    await expectTouchTarget(createAccountButton);
    await expectWithinViewport(createAccountButton, 'create account button');
    await createAccountButton.click();

    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: /create account/i })).toHaveAttribute('aria-selected', 'true');
    await expectNoHorizontalOverflow(page);
  });

  test('publicMobileViewportsAvoidHorizontalOverflow', async ({ page }) => {
    test.setTimeout(90000);

    for (const viewport of PUBLIC_RESPONSIVE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      await expect(page.locator('.auth-card')).toBeVisible({ timeout: 30000 });
      await expectNoHorizontalOverflow(page);

      const previewButton = page.getByRole('button', { name: /preview the first lesson/i }).first();
      await expectTouchTarget(previewButton);
      await previewButton.click();

      await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
      await expectNoHorizontalOverflow(page);

      const createAccountButton = page.getByRole('button', { name: /create free account/i });
      await createAccountButton.scrollIntoViewIfNeeded();
      await expect(createAccountButton).toBeVisible();
      await expectTouchTarget(createAccountButton);
    }
  });

  test('mobilePreviewKeepsAccountActionsReachable', async ({ page }, testInfo) => {
    test.setTimeout(90000);

    test.skip(
      testInfo.project.name !== 'mobile-chrome',
      'Small-phone action reachability is scoped to mobile Chrome.',
    );

    for (const viewport of PUBLIC_PHONE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.getByRole('button', { name: /preview the first lesson/i }).first().click();

      await expect(page.locator('.guest-preview')).toBeVisible({ timeout: 30000 });
      await expectNoHorizontalOverflow(page);
      await expectNoVisibleControlOverlap(page, 'main button, main a');

      const returnButton = page.getByLabel('Return to authentication page');
      await expect(returnButton).toBeVisible();
      await expectTouchTarget(returnButton);

      const createAccountButton = page.getByRole('button', { name: /create free account/i });
      await createAccountButton.scrollIntoViewIfNeeded();
      await expect(createAccountButton).toBeVisible();
      await expectTouchTarget(createAccountButton);
    }
  });
});
