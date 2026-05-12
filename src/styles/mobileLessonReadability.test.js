import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileInteractionsCss = readFileSync(
  path.join(process.cwd(), 'src/styles/mobile-interactions.css'),
  'utf8',
);

describe('mobile lesson readability styles', () => {
  it('removes the framed lesson card on phones so content reads as one flow', () => {
    expect(mobileInteractionsCss).toMatch(/@media \(max-width:\s*600px\)\s*{[\s\S]*\.lesson-surface\s*{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/);
  });

  it('stacks dense learning structure on narrow screens', () => {
    expect(mobileInteractionsCss).toMatch(/\.daily-loop-steps\s*{[^}]*grid-template-columns:\s*1fr;/s);
    expect(mobileInteractionsCss).toMatch(/\.lesson-product-frame\s*{[^}]*grid-template-columns:\s*1fr;/s);
  });

  it('keeps code practice controls tappable without horizontal crowding', () => {
    expect(mobileInteractionsCss).toMatch(/\.code-preview-tabs\s*{[^}]*display:\s*grid;/s);
    expect(mobileInteractionsCss).toMatch(/\.code-preview-actions\s*{[^}]*flex-wrap:\s*wrap;/s);
    expect(mobileInteractionsCss).toMatch(/\.code-preview-copy,\s*\n\s*\.code-preview-reset,\s*\n\s*\.code-preview-explain\s*{[^}]*min-height:\s*44px;/s);
  });
});
