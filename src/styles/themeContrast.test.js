import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function hexToRgb(hex) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
}

function linearize(channel) {
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [red, green, blue] = hexToRgb(hex).map(linearize);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function extractLightTokens() {
  const css = readFileSync('src/styles/shell-layout.css', 'utf8');
  const block = css.match(/\.shell\.light,\s*\.loading-screen\.light,\s*\.light\s*\{(?<body>[\s\S]*?)\}/)?.groups?.body;
  expect(block).toBeTruthy();

  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)]
      .map(([, name, value]) => [`--${name}`, value.toLowerCase()]),
  );
}

describe('theme contrast tokens', () => {
  it('keeps light theme text and accent tokens above WCAG AA contrast on surfaces', () => {
    const tokens = extractLightTokens();
    const foregrounds = [
      '--text',
      '--text-dim',
      '--text-muted',
      '--pink',
      '--cyan',
      '--amber',
      '--purple',
    ];
    const backgrounds = ['--bg-dark', '--bg-card', '--bg-surface'];

    foregrounds.forEach((foreground) => {
      backgrounds.forEach((background) => {
        expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
