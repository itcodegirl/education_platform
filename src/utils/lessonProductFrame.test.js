import { describe, expect, it } from 'vitest';
import {
  getLessonProductFrame,
  getMissingLessonProductFrameFields,
  LESSON_PRODUCT_FRAME_FIELDS,
} from './lessonProductFrame';

describe('lessonProductFrame', () => {
  it('derives the five required learner questions from structured lessons', () => {
    const frame = getLessonProductFrame({
      title: 'Connect pages',
      hook: { accomplishments: ['Create a second HTML page'] },
      do: {
        title: 'Add a link to another page',
        proofRequired: 'a working link between two pages',
      },
      understand: { keyTakeaway: 'Links connect separate documents into one site.' },
      bridge: { preview: 'Next, you will add images.' },
    });

    expect(Object.keys(frame)).toEqual(LESSON_PRODUCT_FRAME_FIELDS.map(({ key }) => key));
    expect(getMissingLessonProductFrameFields(frame)).toEqual([]);
    expect(frame.learn).toBe('Create a second HTML page');
    expect(frame.check).toMatch(/working link/i);
  });

  it('keeps legacy rich lessons inside the same product frame', () => {
    const frame = getLessonProductFrame(
      {
        title: 'JSX Basics',
        concepts: ['JSX lets JavaScript describe UI.'],
        output: 'Dynamic content appears in the browser.',
        tasks: ['Build a profile card with variables.'],
        challenge: 'Build a product card with dynamic pricing.',
      },
      { nextTitle: 'Components Introduction' },
    );

    expect(getMissingLessonProductFrameFields(frame)).toEqual([]);
    expect(frame.learn).toMatch(/JSX/i);
    expect(frame.do).toMatch(/profile card/i);
    expect(frame.next).toBe('Continue with Components Introduction.');
  });
});
