/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

function makeMockMQ(matches) {
  return { matches, addEventListener: () => {}, removeEventListener: () => {} };
}

describe('useTheme without provider (default context)', () => {
  it('returns theme and toggle function', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(typeof result.current.toggle).toBe('function');
  });
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'matchMedia').mockReturnValue(makeMockMQ(false));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders children', () => {
    render(<ThemeProvider><span>hello</span></ThemeProvider>);
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('provides dark theme by default when matchMedia returns false', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('dark');
  });

  it('provides light theme when matchMedia prefers-color-scheme:light matches', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(makeMockMQ(true));
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('light');
  });

  it('toggle switches dark to light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('light');
  });

  it('toggle switches light back to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => { result.current.toggle(); });
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('dark');
  });

  it('restores persisted theme from localStorage', () => {
    localStorage.setItem('chw-theme', JSON.stringify('light'));
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('light');
  });
});
