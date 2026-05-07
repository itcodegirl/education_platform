import { describe, expect, it } from 'vitest';
import { createEmptyLastPosition, mapLastPositionRow } from './lastPositionState';

describe('lastPositionState', () => {
  it('creates a complete empty last position shape', () => {
    expect(createEmptyLastPosition()).toEqual({
      course: '',
      mod: '',
      les: '',
      courseId: '',
      moduleId: '',
      lessonId: '',
      isModuleQuiz: false,
      time: 0,
    });
  });

  it('maps stable database columns into the app resume shape', () => {
    expect(
      mapLastPositionRow({
        course: 'HTML',
        mod: 'Basics',
        les: 'Module Quiz',
        course_id: 'html',
        module_id: 'basics',
        lesson_id: 'intro',
        is_module_quiz: true,
        updated_at: '2026-05-07T12:00:00.000Z',
      }),
    ).toMatchObject({
      course: 'HTML',
      mod: 'Basics',
      les: 'Module Quiz',
      courseId: 'html',
      moduleId: 'basics',
      lessonId: 'intro',
      isModuleQuiz: true,
      time: 1778155200000,
    });
  });
});

