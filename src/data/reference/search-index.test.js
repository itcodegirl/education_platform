import { describe, expect, it } from 'vitest';
import { buildSearchIndexFromCourses } from './search-index';

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
              title: 'Accessible Forms',
              lessons: [
                {
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
});

