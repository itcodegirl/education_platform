import { describe, expect, it, vi } from 'vitest';

vi.mock('../utils/lessonKeys', () => ({
  resolveStableLessonKeyAcrossCourses: (lessonKey) => {
    const map = {
      'HTML|Basics|Intro': 'c:html|m:m-basics|l:l-intro',
      'HTML|Basics|Tags': 'c:html|m:m-basics|l:l-tags',
    };
    return map[lessonKey] || lessonKey;
  },
}));

import { createRecoverableLearnActionWrite } from './learnRouteRecovery';

describe('createRecoverableLearnActionWrite', () => {
  it('builds an addLesson retry for explicit completion requests', () => {
    expect(
      createRecoverableLearnActionWrite('toggle-progress', {
        mode: 'complete',
        lessonKey: 'HTML|Basics|Intro',
      }),
    ).toEqual({
      operation: 'addLesson',
      payload: {
        lessonKey: 'c:html|m:m-basics|l:l-intro',
      },
    });
  });

  it('builds a variant-safe lesson removal retry for explicit uncomplete requests', () => {
    expect(
      createRecoverableLearnActionWrite('toggle-progress', {
        mode: 'uncomplete',
        lessonKey: 'HTML|Basics|Intro',
      }),
    ).toEqual({
      operation: 'removeLessonVariants',
      payload: {
        lessonKeys: ['c:html|m:m-basics|l:l-intro', 'HTML|Basics|Intro'],
        dedupeLessonKey: 'c:html|m:m-basics|l:l-intro',
      },
    });
  });

  it('builds a normalized bookmark save retry', () => {
    expect(
      createRecoverableLearnActionWrite('toggle-bookmark', {
        mode: 'save',
        lessonKey: 'HTML|Basics|Tags',
        courseId: 'html',
        lessonTitle: 'Tags',
      }),
    ).toEqual({
      operation: 'addBookmark',
      payload: {
        bookmark: {
          lessonKey: 'c:html|m:m-basics|l:l-tags',
          courseId: 'html',
          lessonTitle: 'Tags',
        },
      },
    });
  });

  it('builds a variant-safe bookmark removal retry', () => {
    expect(
      createRecoverableLearnActionWrite('toggle-bookmark', {
        mode: 'remove',
        lessonKey: 'HTML|Basics|Tags',
        courseId: 'html',
        lessonTitle: 'Tags',
      }),
    ).toEqual({
      operation: 'removeBookmarkVariants',
      payload: {
        lessonKeys: ['c:html|m:m-basics|l:l-tags', 'HTML|Basics|Tags'],
        dedupeLessonKey: 'c:html|m:m-basics|l:l-tags',
      },
    });
  });
});
