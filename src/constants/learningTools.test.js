import { describe, expect, it } from 'vitest';
import {
  FIRST_SESSION_TOOL_KEYS,
  MOBILE_TOOL_KEYS,
  isLearningToolAvailable,
} from './learningTools';

describe('learning tool availability', () => {
  it('keeps first-session tools inside the mobile tool catalog', () => {
    FIRST_SESSION_TOOL_KEYS.forEach((key) => {
      expect(MOBILE_TOOL_KEYS).toContain(key);
    });
  });

  it('limits advanced tools before the learner completes a lesson', () => {
    expect(isLearningToolAvailable('search', false)).toBe(true);
    expect(isLearningToolAvailable('bookmarks', false)).toBe(true);
    expect(isLearningToolAvailable('stats', false)).toBe(true);
    expect(isLearningToolAvailable('sr', false)).toBe(false);
    expect(isLearningToolAvailable('projects', false)).toBe(false);
    expect(isLearningToolAvailable('badges', false)).toBe(false);
    expect(isLearningToolAvailable('challenges', false)).toBe(false);
  });

  it('restores the complete tool set after real lesson progress exists', () => {
    MOBILE_TOOL_KEYS.forEach((key) => {
      expect(isLearningToolAvailable(key, true)).toBe(true);
    });
  });
});
