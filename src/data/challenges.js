// ═══════════════════════════════════════════════
// CHALLENGES INDEX — Re-exports from per-course files
// ═══════════════════════════════════════════════

import { HTML_CHALLENGES } from './html/challenges';
import { CSS_CHALLENGES } from './css/challenges';
import { JS_CHALLENGES } from './js/challenges';
import { REACT_CHALLENGES } from './react/challenges';

export { HTML_CHALLENGES, CSS_CHALLENGES, JS_CHALLENGES, REACT_CHALLENGES };

const CHALLENGES = {
  html: HTML_CHALLENGES,
  css: CSS_CHALLENGES,
  js: JS_CHALLENGES,
  react: REACT_CHALLENGES,
};

export function getChallengesForCourse(courseId) {
  return CHALLENGES[courseId] || [];
}
