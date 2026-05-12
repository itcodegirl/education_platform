export { buildSearchIndexFromCourses } from './search-index-core';

let cachedSearchIndex = null;
let inFlightSearchIndex = null;

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
