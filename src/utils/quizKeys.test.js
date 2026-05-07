import { describe, expect, it } from 'vitest';
import {
  buildLegacyQuizKey,
  buildStableQuizKey,
  getBestQuizScoreValue,
  getQuizKeyCandidates,
  parseQuizKey,
} from './quizKeys';

describe('quiz key utilities', () => {
  it('builds course-scoped stable quiz keys with legacy fallbacks', () => {
    expect(buildStableQuizKey('l', 'html', 'h1-1')).toBe('l:html:h1-1');
    expect(buildStableQuizKey('m', 'react', 301)).toBe('m:react:301');
    expect(buildLegacyQuizKey('l', 'h1-1')).toBe('l:h1-1');
    expect(buildLegacyQuizKey('m', 301)).toBe('m:301');
  });

  it('parses stable and legacy quiz keys', () => {
    expect(parseQuizKey('l:html:h1-1')).toEqual({
      type: 'l',
      courseId: 'html',
      entityId: 'h1-1',
      isStable: true,
    });
    expect(parseQuizKey('m:301')).toEqual({
      type: 'm',
      courseId: '',
      entityId: '301',
      isStable: false,
    });
  });

  it('dedupes quiz key candidates in stable-first order', () => {
    expect(getQuizKeyCandidates('l:html:h1-1', ['l:h1-1', 'l:h1-1'])).toEqual([
      'l:html:h1-1',
      'l:h1-1',
    ]);
  });

  it('selects the best score across stable and legacy quiz keys', () => {
    expect(
      getBestQuizScoreValue(
        {
          'l:h1-1': '6/10',
          'l:html:h1-1': '7/10',
          'l:html:h1-2': '10/10',
        },
        ['l:html:h1-1', 'l:h1-1'],
      ),
    ).toBe('7/10');
  });
});

