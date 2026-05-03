// Pure helpers for the "mark lesson done" / "unmark lesson" toggle.
//
// AppLayout used to do the wasDone + keyToToggle resolution inline
// using a nested ternary. Extracting it makes the rule explicit:
//
//   1. If the stable key is in the completed set, toggle that one
//   2. Else if the legacy key is in the set, toggle that one
//      (older saves used a label-derived key, so we have to honour
//      what the DB actually stores)
//   3. Otherwise this is a fresh completion — write the stable key
//
// Returning `wasDone` lets the caller pick the next mode without
// re-checking the set.

export function resolveLessonToggle(completedSet, stableLessonKey, legacyLessonKey) {
  const stableSet = completedSet?.has?.(stableLessonKey) ?? false;
  const legacySet = completedSet?.has?.(legacyLessonKey) ?? false;

  if (stableSet) {
    return { keyToToggle: stableLessonKey, wasDone: true };
  }
  if (legacySet) {
    return { keyToToggle: legacyLessonKey, wasDone: true };
  }
  return { keyToToggle: stableLessonKey, wasDone: false };
}

// Minimum visible duration (ms) for the "Saving..." button state.
// Below ~300ms the optimistic toggle + analytics resolve in a
// single frame and the saving label flickers in and out so fast
// that learners think the click did nothing. 350ms reads as
// deliberate without feeling sluggish.
export const MARK_DONE_MIN_FEEDBACK_MS = 350;
