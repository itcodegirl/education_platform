// SEARCH INDEX — runtime compatibility wrapper.
//
// SearchPanel now consumes a generated lightweight manifest so it no
// longer depends on hydrated course content. This file keeps the
// builder available for tests and generation scripts.

import { COURSES, getQuizVariants } from '../index';
import { GLOSSARY } from './glossary';
import { buildSearchIndexFromCourses } from './search-index-core';

export { buildSearchIndexFromCourses } from './search-index-core';

let cachedSearchIndex = null;
let inFlightSearchIndex = null;

export function buildSearchIndex() {
  return buildSearchIndexFromCourses(COURSES, GLOSSARY, { getQuizVariants });
}

export function getCachedSearchIndex() {
  return cachedSearchIndex || [];
}

export async function loadSearchIndex() {
  if (cachedSearchIndex) return cachedSearchIndex;
  if (inFlightSearchIndex) return inFlightSearchIndex;

  inFlightSearchIndex = import('./search-manifest.generated.js')
    .then((module) => {
      cachedSearchIndex = Array.isArray(module.SEARCH_INDEX_MANIFEST)
        ? module.SEARCH_INDEX_MANIFEST
        : [];
      return cachedSearchIndex;
    })
    .finally(() => {
      inFlightSearchIndex = null;
    });

  return inFlightSearchIndex;
}

export function resetSearchIndexCacheForTests() {
  cachedSearchIndex = null;
  inFlightSearchIndex = null;
}
