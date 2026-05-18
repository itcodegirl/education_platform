/* @vitest-environment jsdom */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { getCurrentPath, navigateTo } from './routeUtils';

describe('getCurrentPath', () => {
  it('returns / in jsdom (default pathname)', () => {
    expect(getCurrentPath()).toBe('/');
  });
});

describe('navigateTo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when path is empty', () => {
    const spy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    navigateTo('');
    expect(spy).not.toHaveBeenCalled();
  });

  it('does nothing when path equals current path', () => {
    const spy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    navigateTo('/');
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls pushState for a different path', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    navigateTo('/courses');
    expect(pushSpy).toHaveBeenCalledWith(null, '', '/courses');
  });

  it('dispatches popstate after pushState', () => {
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    const listener = vi.fn();
    window.addEventListener('popstate', listener);
    navigateTo('/courses');
    expect(listener).toHaveBeenCalled();
    window.removeEventListener('popstate', listener);
  });

  it('calls replaceState when replace is true', () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    const pushSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    navigateTo('/courses', { replace: true });
    expect(replaceSpy).toHaveBeenCalledWith(null, '', '/courses');
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('uses pushState by default (replace defaults to false)', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    navigateTo('/about');
    expect(pushSpy).toHaveBeenCalled();
  });
});
