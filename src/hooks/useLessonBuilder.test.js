import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLessonBuilder } from './useLessonBuilder';

describe('useLessonBuilder', () => {
  it('initializes with one empty lesson and the active index pointing at it', () => {
    const { result } = renderHook(() => useLessonBuilder());

    expect(result.current.moduleInfo).toMatchObject({
      id: '',
      emoji: '',
      title: '',
      tagline: '',
      difficulty: 'beginner',
    });
    expect(result.current.lessons).toHaveLength(1);
    expect(result.current.activeLessonIdx).toBe(0);
    expect(result.current.activeLesson).toBe(result.current.lessons[0]);
  });

  it('updateModule patches a single field without disturbing the others', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.updateModule('title', 'Advanced Flexbox'));
    act(() => result.current.updateModule('difficulty', 'intermediate'));

    expect(result.current.moduleInfo.title).toBe('Advanced Flexbox');
    expect(result.current.moduleInfo.difficulty).toBe('intermediate');
    expect(result.current.moduleInfo.id).toBe('');
  });

  it('updateLesson updates only the active lesson, not its siblings', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.addLesson()); // active becomes the new one
    act(() => result.current.updateLesson('title', 'Lesson 2 Title'));

    expect(result.current.lessons[0].title).toBe('');
    expect(result.current.lessons[1].title).toBe('Lesson 2 Title');
  });

  it('addArrayItem appends a blank entry and removeArrayItem removes by index', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.updateArrayItem('concepts', 0, 'first concept'));
    act(() => result.current.addArrayItem('concepts'));
    act(() => result.current.updateArrayItem('concepts', 1, 'second concept'));

    expect(result.current.activeLesson.concepts).toEqual(['first concept', 'second concept']);

    act(() => result.current.removeArrayItem('concepts', 0));
    expect(result.current.activeLesson.concepts).toEqual(['second concept']);
  });

  it('keeps one empty slot when removing the last array item', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.removeArrayItem('concepts', 0));

    // The form must always have at least one input row so the user
    // never sees a "no fields" dead end.
    expect(result.current.activeLesson.concepts).toEqual(['']);
  });

  it('addLesson appends a new lesson and selects it', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.addLesson());

    expect(result.current.lessons).toHaveLength(2);
    expect(result.current.activeLessonIdx).toBe(1);
  });

  it('removeLesson deletes the lesson at the given index', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.addLesson()); // 2 lessons, active=1
    act(() => result.current.addLesson()); // 3 lessons, active=2
    act(() => result.current.removeLesson(1));

    expect(result.current.lessons).toHaveLength(2);
  });

  it('removeLesson clamps the active index when the active lesson is deleted', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.addLesson()); // 2 lessons, active=1
    act(() => result.current.removeLesson(1));

    expect(result.current.lessons).toHaveLength(1);
    expect(result.current.activeLessonIdx).toBe(0);
  });

  it('removeLesson refuses to delete the last remaining lesson', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.removeLesson(0));

    expect(result.current.lessons).toHaveLength(1);
  });

  it('reports validation issues when the module or active lesson are incomplete', () => {
    const { result } = renderHook(() => useLessonBuilder());

    expect(result.current.issues).toContain('Module title is required');
    expect(result.current.issues).toContain('Module ID is required');
    expect(result.current.issues).toContain('Lesson ID is required');
    expect(result.current.issues).toContain('Lesson title is required');
    expect(result.current.issues).toContain('At least one concept is required');
  });

  it('clears module-level issues once the required fields are filled', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.updateModule('id', '21'));
    act(() => result.current.updateModule('title', 'Advanced Flexbox'));

    expect(result.current.issues).not.toContain('Module title is required');
    expect(result.current.issues).not.toContain('Module ID is required');
  });

  it('prefixes lesson-level issues with the lesson number when there are multiple lessons', () => {
    const { result } = renderHook(() => useLessonBuilder());

    act(() => result.current.addLesson());

    // Two lessons present — lesson-specific issues should now be prefixed.
    expect(result.current.issues.some((i) => i.startsWith('Lesson 1: '))).toBe(true);
    expect(result.current.issues.some((i) => i.startsWith('Lesson 2: '))).toBe(true);
  });
});
