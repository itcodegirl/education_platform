import { describe, it, expect } from 'vitest';
import { parseDays } from './analytics-snapshots.js';

describe('parseDays()', () => {
  it('returns the parsed integer for a valid numeric string', () => {
    expect(parseDays('45')).toBe(45);
  });

  it('clamps values below the minimum to 1', () => {
    expect(parseDays('0')).toBe(1);
    expect(parseDays('-10')).toBe(1);
  });

  it('clamps values above the maximum to 180', () => {
    expect(parseDays('200')).toBe(180);
    expect(parseDays('9999')).toBe(180);
  });

  it('returns the default of 30 for non-numeric input', () => {
    expect(parseDays('abc')).toBe(30);
    expect(parseDays(null)).toBe(30);
    expect(parseDays(undefined)).toBe(30);
    expect(parseDays('')).toBe(30);
  });

  it('truncates a float to its integer part', () => {
    expect(parseDays('7.9')).toBe(7);
  });

  it('accepts a numeric value directly', () => {
    expect(parseDays(90)).toBe(90);
  });
});
