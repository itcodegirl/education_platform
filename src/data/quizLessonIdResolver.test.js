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
    const result = resolveQuizLessonId('html', 'h1-1', new Set(['lesson-05']));
    expect(result).toEqual({
      rawLessonId: 'h1-1',
      resolvedLessonId: 'lesson-05',
      resolution: 'alias',
    });
  });

  it('maps explicit high-confidence CSS and JS aliases when targets exist', () => {
    expect(resolveQuizLessonId('css', 'c5-1', new Set(['css-1-4']))).toEqual({
      rawLessonId: 'c5-1',
      resolvedLessonId: 'css-1-4',
      resolution: 'alias',
    });

    expect(resolveQuizLessonId('js', 'j18-1', new Set(['js-1-4']))).toEqual({
      rawLessonId: 'j18-1',
      resolvedLessonId: 'js-1-4',
      resolution: 'alias',
    });
  });

  it('keeps CSS and JS prefix fallback aliases for unmapped legacy IDs', () => {
    expect(resolveQuizLessonId('css', 'c4-2', new Set(['css-4-2']))).toEqual({
      rawLessonId: 'c4-2',
      resolvedLessonId: 'css-4-2',
      resolution: 'alias',
    });

    expect(resolveQuizLessonId('js', 'j2-3', new Set(['js-2-3']))).toEqual({
      rawLessonId: 'j2-3',
      resolvedLessonId: 'js-2-3',
      resolution: 'alias',
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
