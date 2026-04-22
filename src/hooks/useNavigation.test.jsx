import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { MOCK_COURSES, MOCK_QUIZ_MAP } = vi.hoisted(() => {
  const courses = [
    {
      id: 'html',
      label: 'HTML',
      icon: 'globe',
      accent: '#f97316',
      modules: [
        {
          id: 'basics',
          title: 'Basics',
          emoji: 'book',
          lessons: [
            { id: 'l-what', title: 'What is HTML?', content: '', code: '' },
            { id: 'l-tags', title: 'Tags', content: '', code: '' },
          ],
        },
        {
          id: 'advanced',
          title: 'Advanced',
          emoji: 'rocket',
          lessons: [
            { id: 'l-forms', title: 'Forms', content: '', code: '' },
          ],
        },
      ],
    },
    {
      id: 'css',
      label: 'CSS',
      icon: 'palette',
      accent: '#0ea5e9',
      modules: [
        {
          id: 'selectors',
          title: 'Selectors',
          emoji: 'target',
          lessons: [
            { id: 'l-class', title: 'Class Selectors', content: '', code: '' },
          ],
        },
      ],
    },
  ];

  const quizMap = new Map([
    ['m:basics', { id: 'q-basics', questions: [] }],
  ]);

  return { MOCK_COURSES: courses, MOCK_QUIZ_MAP: quizMap };
});

vi.mock('../data', () => ({
  COURSES: MOCK_COURSES,
  QUIZ_MAP: MOCK_QUIZ_MAP,
}));

import { useNavigation } from './useNavigation';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
});

beforeEach(() => {
  window.location.hash = '';
});

describe('useNavigation initial state', () => {
  it('starts at course 0, module 0, lesson 0', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.courseIdx).toBe(0);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
    expect(result.current.showModQuiz).toBe(false);
  });

  it('isFirst is true at 0-0-0', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.isFirst).toBe(true);
  });

  it('formats lessonKey as "course|module|lesson"', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.lessonKey).toBe('HTML|Basics|What is HTML?');
  });

  it('exposes moduleQuiz when available on current module', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.moduleQuiz).toBeDefined();
  });

  it('hydrates from a valid deep-link hash', () => {
    window.location.hash = '#learn/html/basics/l-tags';
    const { result } = renderHook(() => useNavigation());
    expect(result.current.courseIdx).toBe(0);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
    expect(result.current.showModQuiz).toBe(false);
  });

  it('hydrates module quiz deep-links from hash', () => {
    window.location.hash = '#learn/html/basics/quiz';
    const { result } = renderHook(() => useNavigation());
    expect(result.current.courseIdx).toBe(0);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
    expect(result.current.showModQuiz).toBe(true);
  });

  it('falls back to first lesson in the same course for stale lesson ids', () => {
    window.location.hash = '#learn/css/selectors/missing-lesson-id';
    const { result } = renderHook(() => useNavigation());
    expect(result.current.courseIdx).toBe(1);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
    expect(result.current.showModQuiz).toBe(false);
  });
});

describe('useNavigation go()', () => {
  it('jumps to specified module and lesson', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(1, 0));
    expect(result.current.modIdx).toBe(1);
    expect(result.current.lesIdx).toBe(0);
    expect(result.current.showModQuiz).toBe(false);
  });

  it('updates hash so browser navigation can restore lesson state', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));
    expect(window.location.hash).toBe('#learn/html/basics/l-tags');
  });
});

describe('useNavigation next()', () => {
  it('moves to the next lesson in the current module', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.next());
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
  });

  it('opens module quiz on the last lesson when a module quiz exists', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));
    expect(result.current.isLastLesson).toBe(true);
    act(() => result.current.next());
    expect(result.current.showModQuiz).toBe(true);
    expect(result.current.modIdx).toBe(0);
  });

  it('moves to next module after completing quiz', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.showModQuiz).toBe(false);
    expect(result.current.modIdx).toBe(1);
    expect(result.current.lesIdx).toBe(0);
  });
});

describe('useNavigation prev()', () => {
  it('does nothing on very first lesson', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.prev());
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
  });

  it('moves back one lesson within module', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));
    act(() => result.current.prev());
    expect(result.current.lesIdx).toBe(0);
  });

  it('closes module quiz without moving modules', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));
    act(() => result.current.next());
    expect(result.current.showModQuiz).toBe(true);
    act(() => result.current.prev());
    expect(result.current.showModQuiz).toBe(false);
    expect(result.current.modIdx).toBe(0);
  });

  it('moves to final lesson of previous module', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(1, 0));
    act(() => result.current.prev());
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
  });
});

describe('useNavigation switchCourse()', () => {
  it('resets to start of selected course', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(1, 0));
    act(() => result.current.switchCourse(1));
    expect(result.current.courseIdx).toBe(1);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
  });

  it('ignores out-of-bounds course index', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.switchCourse(-1));
    expect(result.current.courseIdx).toBe(0);
    act(() => result.current.switchCourse(99));
    expect(result.current.courseIdx).toBe(0);
  });
});

describe('useNavigation resumeFromPosition()', () => {
  it('restores valid saved position and returns true', () => {
    const { result } = renderHook(() => useNavigation());
    let resumed;
    act(() => {
      resumed = result.current.resumeFromPosition({
        course: 'HTML',
        mod: 'Basics',
        les: 'Tags',
      });
    });
    expect(resumed).toBe(true);
    expect(result.current.courseIdx).toBe(0);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
  });

  it('restores module quiz position', () => {
    const { result } = renderHook(() => useNavigation());
    let resumed;
    act(() => {
      resumed = result.current.resumeFromPosition({
        course: 'HTML',
        mod: 'Basics',
        les: 'Module Quiz',
      });
    });
    expect(resumed).toBe(true);
    expect(result.current.showModQuiz).toBe(true);
  });

  it('returns false for null position', () => {
    const { result } = renderHook(() => useNavigation());
    let resumed;
    act(() => {
      resumed = result.current.resumeFromPosition(null);
    });
    expect(resumed).toBe(false);
  });

  it('returns false when course label is unknown', () => {
    const { result } = renderHook(() => useNavigation());
    let resumed;
    act(() => {
      resumed = result.current.resumeFromPosition({
        course: 'NoSuchCourse',
        mod: 'Basics',
        les: 'Tags',
      });
    });
    expect(resumed).toBe(false);
  });
});
