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

  it('maps CSS and JS prefix aliases when target lessons exist', () => {
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

  it('does not resolve when alias target is missing from active lessons', () => {
    const result = resolveQuizLessonId('css', 'c1-1', new Set(['css-2-1']));
    expect(result).toEqual({
      rawLessonId: 'c1-1',
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
