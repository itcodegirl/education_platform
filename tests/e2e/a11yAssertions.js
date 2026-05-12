import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DEFAULT_TAGS = ['wcag2a', 'wcag2aa'];
const DEFAULT_BLOCKING_IMPACTS = new Set(['serious', 'critical']);

function formatViolations(violations) {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join('; ');
      const suffix = targets ? `: ${targets}` : '';
      return `${violation.id} (${violation.impact}) on ${violation.nodes.length} node(s)${suffix}`;
    })
    .join('\n');
}

async function runAxeWithRetry(page, tags, include) {
  const runAxe = async () => {
    const builder = new AxeBuilder({ page }).withTags(tags);
    if (include) builder.include(include);
    return builder.analyze();
  };

  try {
    return await runAxe();
  } catch (error) {
    const shouldRetry = String(error).includes('Execution context was destroyed');
    if (!shouldRetry) throw error;
    await page.waitForLoadState('domcontentloaded');
    return runAxe();
  }
}

export async function expectNoBlockingAxeViolations(page, {
  tags = DEFAULT_TAGS,
  blockingImpacts = DEFAULT_BLOCKING_IMPACTS,
  include = null,
} = {}) {
  const results = await runAxeWithRetry(page, tags, include);
  const blocking = results.violations.filter((violation) => (
    blockingImpacts.has(violation.impact)
  ));

  expect(
    blocking,
    `Accessibility violations detected:\n${formatViolations(blocking)}`,
  ).toEqual([]);
}
