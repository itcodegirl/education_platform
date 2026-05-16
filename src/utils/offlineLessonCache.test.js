import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestOfflineLessonCache } from './offlineLessonCache';

const originalNavigator = globalThis.navigator;

function setNavigator(value) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value,
  });
}

describe('offline lesson cache', () => {
  afterEach(() => {
    setNavigator(originalNavigator);
  });

  it('posts a safe learn path to the active service worker', () => {
    const postMessage = vi.fn();
    setNavigator({
      serviceWorker: {
        controller: { postMessage },
      },
    });

    expect(requestOfflineLessonCache({
      path: '/learn/html/101/lesson-01',
      courseId: 'html',
      moduleId: '101',
      lessonId: 'lesson-01',
      title: 'Intro',
    })).toBe(true);

    expect(postMessage).toHaveBeenCalledWith({
      type: 'CACHE_CURRENT_LESSON',
      payload: {
        path: '/learn/html/101/lesson-01',
        courseId: 'html',
        moduleId: '101',
        lessonId: 'lesson-01',
        title: 'Intro',
      },
    });
  });

  it('rejects non-learn paths', () => {
    const postMessage = vi.fn();
    setNavigator({
      serviceWorker: {
        controller: { postMessage },
      },
    });

    expect(requestOfflineLessonCache({ path: '/admin' })).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
