import { describe, it, expect } from 'vitest';
import { resolveSavedPosition } from './savedPosition';

const courses = [
  {
    id: 'html',
    icon: '🌐',
    label: 'HTML',
    modules: [
      {
        id: 'm1',
        emoji: '🧱',
        title: 'Foundations',
        lessons: [
          { id: 'l1', title: 'Document structure' },
          { id: 'l2', title: 'Headings and paragraphs' },
        ],
      },
      {
        id: 'm2',
        emoji: '🔗',
        title: 'Links',
        lessons: [
          { id: 'l3', title: 'Anchor tags' },
        ],
      },
    ],
  },
  {
    // Important fixture: this label is a substring of "HTML primer"
    // and was the original collision risk that motivated strict-first
    // matching. If the resolver ever falls back to substring matching
    // for the "primary" save, this entry must NOT win.
    id: 'css',
    icon: '🎨',
    label: 'L',
    modules: [
      {
        id: 'm3',
        emoji: '🎨',
        title: 'Selectors',
        lessons: [{ id: 'l4', title: 'Type selectors' }],
      },
    ],
  },
];

describe('resolveSavedPosition', () => {
  it('returns null when the saved payload is incomplete', () => {
    expect(resolveSavedPosition(null, courses)).toBeNull();
    expect(resolveSavedPosition({ course: '', mod: '', les: '' }, courses)).toBeNull();
    expect(
      resolveSavedPosition({ course: 'HTML', mod: 'Foundations', les: '' }, courses),
    ).toBeNull();
  });

  it('resolves the modern emoji+label form AppLayout writes', () => {
    expect(
      resolveSavedPosition(
        {
          course: '🌐 HTML',
          mod: '🧱 Foundations',
          les: 'Headings and paragraphs',
        },
        courses,
      ),
    ).toEqual({
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 1,
      isModuleQuiz: false,
    });
  });

  it('resolves a save written with the bare label (forward compat)', () => {
    expect(
      resolveSavedPosition(
        { course: 'HTML', mod: 'Foundations', les: 'Document structure' },
        courses,
      ),
    ).toEqual({
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 0,
      isModuleQuiz: false,
    });
  });

  it('does not let a single-character label collide via substring matching', () => {
    // "HTML primer" contains the letter "L" — a previous version of
    // this resolver used pure includes() and would have happily
    // routed this save to the CSS course because its label was "L".
    // Strict-first matching makes the HTML strict-equal hit win.
    expect(
      resolveSavedPosition(
        { course: 'HTML', mod: 'Foundations', les: 'Document structure' },
        courses,
      ).courseIndex,
    ).toBe(0);
  });

  it('resolves a module quiz save back to the last lesson index of the module', () => {
    const result = resolveSavedPosition(
      { course: '🌐 HTML', mod: '🧱 Foundations', les: '📝 Module Quiz' },
      courses,
    );
    expect(result).toEqual({
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 1,
      isModuleQuiz: true,
    });
  });

  it('returns null when the lesson title cannot be matched', () => {
    expect(
      resolveSavedPosition(
        { course: '🌐 HTML', mod: '🧱 Foundations', les: 'Lesson that no longer exists' },
        courses,
      ),
    ).toBeNull();
  });

  it('returns null when the course list is empty', () => {
    expect(
      resolveSavedPosition({ course: 'HTML', mod: 'Foundations', les: 'Document structure' }, []),
    ).toBeNull();
  });
});
