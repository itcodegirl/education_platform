import { describe, it, expect } from 'vitest';
import { COURSES, QUIZ_MAP } from '../data';

describe('COURSES', () => {
  it('has 4 courses', () => {
    expect(COURSES).toHaveLength(4);
  });

  it('has correct course IDs', () => {
    const ids = COURSES.map(c => c.id);
    expect(ids).toEqual(['html', 'css', 'js', 'react']);
  });

  it('each course has required fields', () => {
    for (const course of COURSES) {
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('label');
      expect(course).toHaveProperty('icon');
      expect(course).toHaveProperty('accent');
      expect(course).toHaveProperty('modules');
      expect(course.modules.length).toBeGreaterThan(0);
    }
  });

  it('each module has lessons', () => {
    for (const course of COURSES) {
      for (const mod of course.modules) {
        expect(mod).toHaveProperty('id');
        expect(mod).toHaveProperty('title');
        expect(mod).toHaveProperty('lessons');
        expect(mod.lessons.length).toBeGreaterThan(0);
      }
    }
  });

  it('each lesson has id and title', () => {
    for (const course of COURSES) {
      for (const mod of course.modules) {
        for (const les of mod.lessons) {
          expect(les).toHaveProperty('id');
          expect(les).toHaveProperty('title');
          expect(les.id).toBeTruthy();
          expect(les.title).toBeTruthy();
        }
      }
    }
  });

  it('lesson IDs are unique within a course', () => {
    for (const course of COURSES) {
      const ids = new Set();
      for (const mod of course.modules) {
        for (const les of mod.lessons) {
          expect(ids.has(les.id)).toBe(false);
          ids.add(les.id);
        }
      }
    }
  });
});

describe('QUIZ_MAP', () => {
  it('is a Map', () => {
    expect(QUIZ_MAP).toBeInstanceOf(Map);
  });

  it('has quiz entries', () => {
    expect(QUIZ_MAP.size).toBeGreaterThan(0);
  });

  it('quiz keys use l: or m: prefix', () => {
    for (const key of QUIZ_MAP.keys()) {
      expect(key).toMatch(/^[lm]:/);
    }
  });

  it('each quiz has questions array', () => {
    for (const quiz of QUIZ_MAP.values()) {
      expect(quiz).toHaveProperty('questions');
      expect(Array.isArray(quiz.questions)).toBe(true);
      expect(quiz.questions.length).toBeGreaterThan(0);
    }
  });

  it('each question has id and correct answer', () => {
    for (const quiz of QUIZ_MAP.values()) {
      for (const q of quiz.questions) {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('correct');
      }
    }
  });
});
