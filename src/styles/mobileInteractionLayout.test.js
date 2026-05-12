import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileInteractionsCss = readFileSync(
  path.join(process.cwd(), 'src/styles/mobile-interactions.css'),
  'utf8',
);

describe('mobile interaction layout styles', () => {
  it('keeps critical mobile controls at comfortable touch sizes', () => {
    expect(mobileInteractionsCss).toMatch(/\.mobile-tools-close\s*{[^}]*min-height:\s*44px;/s);
    expect(mobileInteractionsCss).toMatch(/\.sidebar-avatar\s*{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
    expect(mobileInteractionsCss).toMatch(/\.lock-label\s*{[^}]*min-height:\s*44px;/s);
    expect(mobileInteractionsCss).toMatch(/\.search-clear\s*{[^}]*min-height:\s*44px;/s);
  });

  it('turns search into a viewport-aware mobile dialog', () => {
    expect(mobileInteractionsCss).toMatch(/\.search-overlay\s*{[^}]*align-items:\s*stretch;/s);
    expect(mobileInteractionsCss).toMatch(/\.search-overlay\s*{[^}]*min-height:\s*100dvh;/s);
    expect(mobileInteractionsCss).toMatch(/\.search-modal\s*{[^}]*max-height:\s*calc\(100dvh/s);
    expect(mobileInteractionsCss).toMatch(/\.search-hint\s*{[^}]*clip:\s*rect\(0,\s*0,\s*0,\s*0\);/s);
  });

  it('keeps modal panels usable when the virtual keyboard is open', () => {
    expect(mobileInteractionsCss).toMatch(/\.shell\.keyboard-open\s+\.search-modal\s*{[^}]*max-height:\s*calc\(100dvh/s);
    expect(mobileInteractionsCss).toMatch(/\.shell\.keyboard-open\s+\.panel-kicker,\s*\n\s*\.shell\.keyboard-open\s+\.search-hint\s*{[^}]*display:\s*none;/s);
  });

  it('adds a visible bottom-sheet affordance and panel touch floors', () => {
    expect(mobileInteractionsCss).toMatch(/\.mobile-tools-sheet::before\s*{[^}]*width:\s*42px;[^}]*height:\s*4px;/s);
    expect(mobileInteractionsCss).toMatch(/\.cs-trigger,\s*\n\s*\.empty-state-action,\s*\n\s*\.sr-generate-topic,\s*\n\s*\.sr-generate-btn,\s*\n\s*\.sr-opt,\s*\n\s*\.bk-main\s*{[^}]*min-height:\s*44px;/s);
  });
});
