// SEARCH INDEX — runtime compatibility wrapper.
//
// SearchPanel now consumes a generated lightweight manifest so it no
// longer depends on hydrated course content. This file keeps the
// builder available for tests and generation scripts.

import { COURSES, getQuizVariants } from '../index';
import { GLOSSARY } from './glossary';
import { buildSearchIndexFromCourses } from './search-index-core';

export { buildSearchIndexFromCourses } from './search-index-core';

export function buildSearchIndex() {
  return buildSearchIndexFromCourses(COURSES, GLOSSARY, { getQuizVariants });
}
