import { describe, expect, it } from 'vitest';
import {
  FIRST_SESSION_TOOL_KEYS,
  MOBILE_TOOL_KEYS,
  getBottomSecondaryTools,
  getMobileLearningTools,
  getSidebarResourceTools,
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
    expect(isLearningToolAvailable('glossary', false)).toBe(true);
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

  it('uses the same first-session filter across tool surfaces', () => {
    const sidebarKeys = getSidebarResourceTools(false).map((tool) => tool.key);
    const bottomKeys = getBottomSecondaryTools(false).map((tool) => tool.key);
    const mobileKeys = getMobileLearningTools(false).map((tool) => tool.key);

    expect(sidebarKeys).toEqual(['bookmarks', 'glossary', 'cheatsheet']);
    expect(bottomKeys).toEqual(['cheatsheet', 'glossary']);
    expect(mobileKeys).toEqual(['search', 'bookmarks', 'stats', 'cheatsheet', 'glossary']);
  });

  it('builds sidebar resource tools from the shared copy registry', () => {
    const firstSessionTools = getSidebarResourceTools(false);

    expect(firstSessionTools[0]).toMatchObject({
      key: 'bookmarks',
      label: 'Saved lessons',
      hint: 'Return to lessons you chose to keep close.',
    });
  });

  it('builds mobile tool items with explicit handlers', () => {
    const onSearch = () => {};
    const onSR = () => {};
    const tools = getMobileLearningTools(true, { onSearch, onSR });

    expect(tools.find((tool) => tool.key === 'search')).toMatchObject({
      icon: 'S',
      label: 'Search',
      shortLabel: 'Search',
      helper: 'Find wording',
      onSelect: onSearch,
    });
    expect(tools.find((tool) => tool.key === 'sr')).toMatchObject({
      icon: 'R',
      label: 'Review queue',
      shortLabel: 'Review',
      onSelect: onSR,
    });
  });
});
