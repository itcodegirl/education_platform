// ═══════════════════════════════════════════════
// CHALLENGES INDEX — Lazy per-course challenge loading
// ═══════════════════════════════════════════════

import { COURSE_METADATA } from './metadata';
import { loadCourseChallenges } from './loaders';

const challengeCache = new Map();
const inFlight = new Map();

export function areChallengesLoaded(courseId) {
  return challengeCache.has(courseId);
}

export function getChallengesForCourse(courseId) {
  return challengeCache.get(courseId) || [];
}

export function loadChallengesForCourse(courseId) {
  if (challengeCache.has(courseId)) {
    return Promise.resolve(challengeCache.get(courseId));
  }

  let promise = inFlight.get(courseId);
  if (!promise) {
    promise = loadCourseChallenges(courseId)
      .then((challenges) => {
        const normalized = Array.isArray(challenges) ? challenges : [];
        challengeCache.set(courseId, normalized);
        return normalized;
      })
      .finally(() => {
        inFlight.delete(courseId);
      });

    inFlight.set(courseId, promise);
  }

  return promise;
}

export async function loadAllChallenges() {
  const loaded = await Promise.all(
    COURSE_METADATA.map(async ({ id }) => [id, await loadChallengesForCourse(id)]),
  );

  return Object.fromEntries(loaded);
}
