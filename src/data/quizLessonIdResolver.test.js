import { describe, expect, it } from 'vitest';
import { resolveQuizLessonId } from './quizLessonIdResolver';

describe('quizLessonIdResolver', () => {
  it('resolves direct lesson IDs without aliasing', () => {
    const result = resolveQuizLessonId('html', 'lesson-01', new Set(['lesson-01']));
    expect(result).toEqual({
      rawLessonId: 'lesson-01',
      resolvedLessonId: 'lesson-01',
      resolution: 'direct',
    });
  });

  it('maps explicit HTML legacy IDs to active lesson IDs', () => {
    const result = resolveQuizLessonId('html', 'h12-1', new Set(['lesson-05']));
    expect(result).toEqual({
      rawLessonId: 'h12-1',
      resolvedLessonId: 'lesson-05',
      resolution: 'alias',
    });
  });

  it('does not resolve mismatched HTML aliases for forms and tables lessons', () => {
    expect(resolveQuizLessonId('html', 'h1-1', new Set(['lesson-05']))).toEqual({
      rawLessonId: 'h1-1',
      resolvedLessonId: null,
      resolution: 'unresolved',
    });

    expect(resolveQuizLessonId('html', 'h1-2', new Set(['lesson-06']))).toEqual({
      rawLessonId: 'h1-2',
      resolvedLessonId: null,
      resolution: 'unresolved',
    });
  });

  it('keeps aligned HTML aliases for forms and tables lessons', () => {
    expect(resolveQuizLessonId('html', 'h12-2', new Set(['lesson-05']))).toEqual({
      rawLessonId: 'h12-2',
      resolvedLessonId: 'lesson-05',
      resolution: 'alias',
    });

    expect(resolveQuizLessonId('html', 'h9-1', new Set(['lesson-06']))).toEqual({
      rawLessonId: 'h9-1',
      resolvedLessonId: 'lesson-06',
      resolution: 'alias',
    });
  });

  it('maps explicit high-confidence CSS and JS aliases when targets exist', () => {
    const cssAliases = [
      ['c5-1', 'css-1-4'],
      ['c6-2', 'css-2-1'],
      ['c6-3', 'css-2-3'],
      ['c7-1', 'css-3-2'],
      ['c7-3', 'css-4-1'],
      ['c8-1', 'css-4-3'],
    ];

    cssAliases.forEach(([rawLessonId, targetLessonId]) => {
      expect(resolveQuizLessonId('css', rawLessonId, new Set([targetLessonId]))).toEqual({
        rawLessonId,
        resolvedLessonId: targetLessonId,
        resolution: 'alias',
      });
    });

    const jsAliases = [
      ['j7-1', 'js-2-1'],
      ['j7-2', 'js-2-2'],
      ['j8-1', 'js-2-3'],
      ['j8-2', 'js-2-3'],
      ['j18-1', 'js-1-4'],
      ['j21-2', 'js-3-1'],
    ];

    jsAliases.forEach(([rawLessonId, targetLessonId]) => {
      expect(resolveQuizLessonId('js', rawLessonId, new Set([targetLessonId]))).toEqual({
        rawLessonId,
        resolvedLessonId: targetLessonId,
        resolution: 'alias',
      });
    });
  });

  it('keeps CSS and JS prefix fallback aliases for unmapped legacy IDs', () => {
    expect(resolveQuizLessonId('css', 'c4-2', new Set(['css-4-2']))).toEqual({
      rawLessonId: 'c4-2',
      resolvedLessonId: 'css-4-2',
      resolution: 'alias',
    });

    expect(resolveQuizLessonId('js', 'j4-2', new Set(['js-4-2']))).toEqual({
      rawLessonId: 'j4-2',
      resolvedLessonId: 'js-4-2',
      resolution: 'alias',
    });
  });

  it('does not resolve risky CSS and JS fallback IDs', () => {
    const cssFallbackBlocked = ['c2-1', 'c2-3', 'c3-2', 'c4-1', 'c4-3'];
    cssFallbackBlocked.forEach((rawLessonId) => {
      const fallbackTarget = rawLessonId.replace(/^c(\d+)-(\d+)$/, 'css-$1-$2');
      expect(resolveQuizLessonId('css', rawLessonId, new Set([fallbackTarget]))).toEqual({
        rawLessonId,
        resolvedLessonId: null,
        resolution: 'unresolved',
      });
    });

    const jsFallbackBlocked = ['j2-1', 'j2-2', 'j2-3', 'j3-1'];
    jsFallbackBlocked.forEach((rawLessonId) => {
      const fallbackTarget = rawLessonId.replace(/^j(\d+)-(\d+)$/, 'js-$1-$2');
      expect(resolveQuizLessonId('js', rawLessonId, new Set([fallbackTarget]))).toEqual({
        rawLessonId,
        resolvedLessonId: null,
        resolution: 'unresolved',
      });
    });
  });

  it('maps explicit high-confidence React aliases when targets exist', () => {
    expect(resolveQuizLessonId('react', 'r3-1', new Set(['r1-3']))).toEqual({
      rawLessonId: 'r3-1',
      resolvedLessonId: 'r1-3',
      resolution: 'alias',
    });
  });

  it('does not resolve when alias target is missing from active lessons', () => {
    const result = resolveQuizLessonId('css', 'c1-1', new Set(['css-2-1']));
    expect(result).toEqual({
      rawLessonId: 'c1-1',
      resolvedLessonId: null,
      resolution: 'unresolved',
    });
  });

  it('does not add medium-confidence HTML aliases', () => {
    const result = resolveQuizLessonId('html', 'h13-2', new Set(['lesson-07']));
    expect(result).toEqual({
      rawLessonId: 'h13-2',
      resolvedLessonId: null,
      resolution: 'unresolved',
    });
  });

  it('does not cross-map unsupported courses', () => {
    const reactResult = resolveQuizLessonId('react', 'r2-1', new Set(['r2-1']));
    expect(reactResult).toEqual({
      rawLessonId: 'r2-1',
      resolvedLessonId: 'r2-1',
      resolution: 'direct',
    });

    const pythonResult = resolveQuizLessonId('python', 'py-1-1', new Set(['py-2-1']));
    expect(pythonResult).toEqual({
      rawLessonId: 'py-1-1',
      resolvedLessonId: null,
      resolution: 'unresolved',
    });
  });
});
