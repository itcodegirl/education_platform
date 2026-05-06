import { describe, it, expect } from 'vitest';
import { MARK_DONE_MIN_FEEDBACK_MS, resolveLessonToggle } from './lessonToggle';

describe('resolveLessonToggle', () => {
  it('returns the stable key as a fresh completion when nothing is in the set', () => {
    const set = new Set();
    expect(resolveLessonToggle(set, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'stable-1',
      wasDone: false,
    });
  });

  it('toggles the stable key off when only the stable key is in the set', () => {
    const set = new Set(['stable-1']);
    expect(resolveLessonToggle(set, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'stable-1',
      wasDone: true,
    });
  });

  it('toggles the legacy key off when only the legacy key is in the set', () => {
    // This is the migration case: a learner who completed a lesson
    // on an older build has the label-derived key persisted. The
    // toggle has to operate on that exact key, not the stable one,
    // so the row in Supabase actually gets removed.
    const set = new Set(['legacy-1']);
    expect(resolveLessonToggle(set, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'legacy-1',
      wasDone: true,
    });
  });

  it('prefers the stable key when both forms are present', () => {
    // Defensive: if both ever coexist (mixed migration state), the
    // canonical one is the stable key. Either toggle would resolve
    // the duplicate, but choosing stable keeps the survivor in the
    // canonical shape.
    const set = new Set(['stable-1', 'legacy-1']);
    expect(resolveLessonToggle(set, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'stable-1',
      wasDone: true,
    });
  });

  it('returns wasDone=false when the keys are blank', () => {
    expect(resolveLessonToggle(new Set(), '', '')).toEqual({
      keyToToggle: '',
      wasDone: false,
    });
  });

  it('does not crash when completedSet is missing or malformed', () => {
    expect(resolveLessonToggle(undefined, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'stable-1',
      wasDone: false,
    });
    expect(resolveLessonToggle(null, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'stable-1',
      wasDone: false,
    });
    expect(resolveLessonToggle({}, 'stable-1', 'legacy-1')).toEqual({
      keyToToggle: 'stable-1',
      wasDone: false,
    });
  });
});

describe('MARK_DONE_MIN_FEEDBACK_MS', () => {
  it('is at least 250ms (the human-perceptible threshold)', () => {
    expect(MARK_DONE_MIN_FEEDBACK_MS).toBeGreaterThanOrEqual(250);
  });

  it('is short enough to feel responsive (<= 600ms)', () => {
    expect(MARK_DONE_MIN_FEEDBACK_MS).toBeLessThanOrEqual(600);
  });
});
