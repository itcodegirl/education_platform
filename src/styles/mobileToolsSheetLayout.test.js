import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const panelsCss = readFileSync(path.join(process.cwd(), 'src/styles/panels.css'), 'utf8');

describe('mobile tools sheet layout styles', () => {
  it('contains backdrop gestures and sheet scrolling', () => {
    expect(panelsCss).toMatch(/\.mobile-tools-scrim\s*{[^}]*touch-action:\s*none;/s);
    expect(panelsCss).toMatch(/\.mobile-tools-sheet\s*{[^}]*overscroll-behavior-y:\s*contain;/s);
  });

  it('uses direct manipulation for sheet controls', () => {
    expect(panelsCss).toMatch(/\.mobile-tools-close\s*{[^}]*touch-action:\s*manipulation;/s);
    expect(panelsCss).toMatch(/\.mobile-tools-item\s*{[^}]*touch-action:\s*manipulation;/s);
  });
});
