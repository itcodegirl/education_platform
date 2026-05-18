import { describe, it, expect } from 'vitest';
import { getPanelFromHistoryState, parseStoredBoolean } from './usePanels';

describe('getPanelFromHistoryState', () => {
  it('returns null for null/undefined state', () => {
    expect(getPanelFromHistoryState(null)).toBeNull();
    expect(getPanelFromHistoryState(undefined)).toBeNull();
  });

  it('returns the chwPanel value from state', () => {
    expect(getPanelFromHistoryState({ chwPanel: 'glossary' })).toBe('glossary');
  });

  it('falls back to legacy cinovaPanel key', () => {
    expect(getPanelFromHistoryState({ cinovaPanel: 'notes' })).toBe('notes');
  });

  it('prefers chwPanel over cinovaPanel', () => {
    expect(getPanelFromHistoryState({ chwPanel: 'new', cinovaPanel: 'old' })).toBe('new');
  });

  it('returns null when neither key is present', () => {
    expect(getPanelFromHistoryState({ other: 'value' })).toBeNull();
  });
});

describe('parseStoredBoolean', () => {
  it('returns false for null', () => {
    expect(parseStoredBoolean(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(parseStoredBoolean(undefined)).toBe(false);
  });

  it('returns true for JSON-encoded true', () => {
    expect(parseStoredBoolean('true')).toBe(true);
  });

  it('returns false for JSON-encoded false', () => {
    expect(parseStoredBoolean('false')).toBe(false);
  });

  it('returns true for string "1"', () => {
    expect(parseStoredBoolean('1')).toBe(true);
  });

  it('returns false for string "0"', () => {
    expect(parseStoredBoolean('0')).toBe(false);
  });

  it('returns false for random non-truthy strings', () => {
    expect(parseStoredBoolean('yes')).toBe(false);
    expect(parseStoredBoolean('')).toBe(false);
  });
});
