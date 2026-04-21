// ═══════════════════════════════════════════════
// Unit tests for useNavigation hook
//
// We mock the data layer so the tests run with a
// small, controlled course structure rather than
// the full production course content.  All
// navigation logic — go/next/prev/switchCourse/
// resumeFromPosition — is exercised here.
// ═══════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mock the data layer ─────────────────────────
// vi.mock is hoisted above variable declarations, so
// mock data must be defined inside vi.hoisted().
const { MOCK_COURSES, MOCK_QUIZ_MAP } = vi.hoisted(() => {
  const courses = [
    {
      id: 'html',
      label: 'HTML',
      icon: '🌐',
      accent: '#f97316',
      modules: [
        {
          id: 'basics',
          title: 'Basics',
          emoji: '📖',
          lessons: [
            { id: 'l-what', title: 'What is HTML?', content: '', code: '' },
            { id: 'l-tags', title: 'Tags', content: '', code: '' },
          ],
        },
        {
          id: 'advanced',
          title: 'Advanced',
          emoji: '🚀',
          lessons: [
            { id: 'l-forms', title: 'Forms', content: '', code: '' },
          ],
        },
      ],
    },
    {
      id: 'css',
      label: 'CSS',
      icon: '🎨',
      accent: '#0ea5e9',
      modules: [
        {
          id: 'selectors',
          title: 'Selectors',
          emoji: '🎯',
          lessons: [
            { id: 'l-class', title: 'Class Selectors', content: '', code: '' },
          ],
        },
      ],
    },
  ];
  // Module quiz exists for the 'basics' module (id = 'basics')
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

// jsdom doesn't implement matchMedia — provide a minimal stub
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
});

describe('useNavigation — initial state', () => {
  it('starts at course 0, mod 0, lesson 0', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.courseIdx).toBe(0);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
    expect(result.current.showModQuiz).toBe(false);
  });

  it('isFirst is true at position 0-0-0', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.isFirst).toBe(true);
  });

  it('formats lessonKey as "course|mod|lesson"', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.lessonKey).toBe('HTML|Basics|What is HTML?');
  });

  it('exposes moduleQuiz when one exists for the current module', () => {
    const { result } = renderHook(() => useNavigation());
    // Basics module has a quiz in MOCK_QUIZ_MAP
    expect(result.current.moduleQuiz).toBeDefined();
  });
});

describe('useNavigation — go()', () => {
  it('jumps to specified module and lesson', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(1, 0));
    expect(result.current.modIdx).toBe(1);
    expect(result.current.lesIdx).toBe(0);
    expect(result.current.showModQuiz).toBe(false);
  });
});

describe('useNavigation — next()', () => {
  it('advances to the next lesson within the same module', () => {
    const { result } = renderHook(() => useNavigation());
    // Start at Basics lesson 0 → advance to lesson 1
    act(() => result.current.next());
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
  });

  it('shows module quiz when reaching last lesson of a module that has one', () => {
    const { result } = renderHook(() => useNavigation());
    // Jump to last lesson of Basics (index 1)
    act(() => result.current.go(0, 1));
    expect(result.current.isLastLesson).toBe(true);
    // next() should trigger the quiz, not advance the module
    act(() => result.current.next());
    expect(result.current.showModQuiz).toBe(true);
    expect(result.current.modIdx).toBe(0);
  });

  it('advances to next module after completing the quiz', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));     // last lesson of Basics
    act(() => result.current.next());        // → quiz
    act(() => result.current.next());        // → Advanced mod 1
    expect(result.current.showModQuiz).toBe(false);
    expect(result.current.modIdx).toBe(1);
    expect(result.current.lesIdx).toBe(0);
  });
});

describe('useNavigation — prev()', () => {
  it('does nothing at the very first lesson (isFirst)', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.prev());
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
  });

  it('goes back one lesson within the same module', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));  // lesson 1
    act(() => result.current.prev());
    expect(result.current.lesIdx).toBe(0);
  });

  it('closes the module quiz without moving module', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(0, 1));
    act(() => result.current.next()); // open quiz
    expect(result.current.showModQuiz).toBe(true);
    act(() => result.current.prev()); // close quiz
    expect(result.current.showModQuiz).toBe(false);
    expect(result.current.modIdx).toBe(0);
  });

  it('goes to the last lesson of the previous module', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(1, 0));  // Advanced mod, lesson 0
    act(() => result.current.prev());
    // Should land on last lesson of Basics (index 1)
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(1);
  });
});

describe('useNavigation — switchCourse()', () => {
  it('resets to the start of another course', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.go(1, 0));
    act(() => result.current.switchCourse(1));
    expect(result.current.courseIdx).toBe(1);
    expect(result.current.modIdx).toBe(0);
    expect(result.current.lesIdx).toBe(0);
  });

  it('ignores an out-of-bounds course index', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.switchCourse(-1));
    expect(result.current.courseIdx).toBe(0);
    act(() => result.current.switchCourse(99));
    expect(result.current.courseIdx).toBe(0);
  });
});

describe('useNavigation — resumeFromPosition()', () => {
  it('restores a valid saved position and returns true', () => {
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
    expect(result.current.lesIdx).toBe(1); // 'Tags' is index 1
  });

  it('restores a module-quiz position', () => {
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

  it('returns false for a null position', () => {
    const { result } = renderHook(() => useNavigation());
    let resumed;
    act(() => {
      resumed = result.current.resumeFromPosition(null);
    });
    expect(resumed).toBe(false);
  });

  it('returns false when the course label is not found', () => {
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
