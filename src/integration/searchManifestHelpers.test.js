import { describe, expect, it } from 'vitest';
import {
  normalizeSearchManifestSource,
  searchManifestSourcesMatch,
} from '../../scripts/search-manifest-helpers.mjs';

describe('search manifest helpers', () => {
  it('normalizes CRLF line endings before comparing manifest sources', () => {
    const lfSource = 'export const SEARCH_INDEX_MANIFEST = Object.freeze([]);\n';
    const crlfSource = lfSource.replaceAll('\n', '\r\n');

    expect(normalizeSearchManifestSource(crlfSource)).toBe(lfSource);
    expect(searchManifestSourcesMatch(crlfSource, lfSource)).toBe(true);
  });

  it('still reports real content differences as stale', () => {
    expect(searchManifestSourcesMatch('export const a = 1;\n', 'export const a = 2;\n'))
      .toBe(false);
  });
});
