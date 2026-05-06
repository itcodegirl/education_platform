import { describe, expect, it } from 'vitest';
import { buildSearchIndexFromCourses } from './search-index';

const courses = [
  {
    id: 'html',
    label: 'HTML',
    icon: '<>',
    modules: [
      {
        title: 'Structure',
        lessons: [
          {
            title: 'Semantic Layout',
            concepts: ['landmarks', 'document outline'],
            code: '<main><article class="card">Hello</article></main>',
            challenge: {
              title: 'Build a semantic profile',
              requirements: ['Use a main landmark', 'Include an accessible heading'],
              starterCode: '<main><h1>Profile</h1></main>',
            },
            understand: {
              concepts: [
                { term: 'ARIA labels', meaning: 'Use names when visible text is not enough' },
              ],
            },
          },
        ],
      },
    ],
  },
];

const glossary = [
  {
    course: 'html',
    term: 'Skip link',
    def: 'Keyboard shortcut link that moves focus to the main content.',
  },
];

describe('buildSearchIndexFromCourses', () => {
  it('search.index.includes-structured-lesson-fields', () => {
    const [entry] = buildSearchIndexFromCourses(courses, glossary);

    expect(entry.keywords).toContain('semantic layout');
    expect(entry.keywords).toContain('aria labels');
    expect(entry.keywords).toContain('use a main landmark');
    expect(entry.keywords).toContain('main article class card');
    expect(entry.keywords).toContain('skip link');
  });
});
