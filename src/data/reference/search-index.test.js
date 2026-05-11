import { describe, expect, it } from 'vitest';
import { buildSearchIndexFromCourses } from './search-index-core';

describe('buildSearchIndexFromCourses', () => {
  it('indexes structured lesson search coverage', () => {
    const index = buildSearchIndexFromCourses(
      [
        {
          id: 'html',
          label: 'HTML',
          icon: 'H',
          modules: [
            {
              id: 'forms',
              title: 'Accessible Forms',
              lessons: [
                {
                  id: 'labels-status',
                  title: 'Labels and status messages',
                  hook: {
                    accomplishment: 'Wire up an aria live confirmation',
                  },
                  do: {
                    steps: ['Connect a label to an input', 'Announce form status politely'],
                  },
                  understand: {
                    concepts: [
                      {
                        term: 'Accessible name',
                        definition: 'The label screen readers announce for a control',
                        analogy: 'A name tag for interactive elements',
                      },
                    ],
                  },
                  challenge: {
                    requirements: ['Render a status region', 'Keep the submit button reachable'],
                    summary: 'The form communicates progress without surprise.',
                  },
                  bridge: 'Next, turn the same pattern into a quiz explanation.',
                  quiz: {
                    explanation: 'The label element gives the input a stable accessible name.',
                  },
                },
              ],
            },
          ],
        },
      ],
      [{ course: 'html', term: 'Form control', def: 'An input, select, or textarea' }],
    );

    expect(index).toHaveLength(1);
    const keywords = index[0].keywords;
    expect(keywords).toContain('aria live confirmation');
    expect(keywords).toContain('announce form status politely');
    expect(keywords).toContain('accessible name');
    expect(keywords).toContain('name tag for interactive elements');
    expect(keywords).toContain('render a status region');
    expect(keywords).toContain('quiz explanation');
    expect(keywords).toContain('form control');
  });

  it('indexes related quiz explanations for lesson search', () => {
    const index = buildSearchIndexFromCourses(
      [
        {
          id: 'js',
          label: 'JavaScript',
          icon: 'J',
          modules: [
            {
              id: 'async',
              title: 'Async JavaScript',
              lessons: [
                {
                  id: 'fetch-errors',
                  title: 'Fetch errors',
                  summary: { capabilities: ['Handle failed requests calmly'] },
                },
              ],
            },
          ],
        },
      ],
      [],
      {
        getQuizVariants: (courseId, type, entityId) => {
          if (courseId === 'js' && type === 'l' && entityId === 'fetch-errors') {
            return {
              primary: {
                questions: [
                  {
                    question: 'What should a catch block do?',
                    explanation: 'A retry message should be specific and recoverable.',
                  },
                ],
              },
              bonus: [],
            };
          }

          return null;
        },
      },
    );

    expect(index).toHaveLength(1);
    expect(index[0].keywords).toContain('retry message should be specific and recoverable');
  });
});

