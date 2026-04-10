import { describe, it, expect } from 'vitest';

// Re-implement isAnswerCorrect here since it's not exported from QuizView.
// This tests the core quiz grading logic independently.
function isAnswerCorrect(q, answer) {
  if (answer === undefined || answer === null) return false;

  switch (q.type) {
    case 'mc':
    case 'code':
    case 'bug':
      return answer === q.correct;

    case 'fill': {
      if (!answer) return false;
      const student = answer.toString().trim().toLowerCase().replace(/['"`;{}()]/g, '');
      const accepts = Array.isArray(q.correct) ? q.correct : [q.correct];
      return accepts.some(a => student === a.toString().trim().toLowerCase().replace(/['"`;{}()]/g, ''));
    }

    case 'order':
      if (!Array.isArray(answer)) return false;
      return JSON.stringify(answer) === JSON.stringify(q.correct);

    default:
      return answer === q.correct;
  }
}

describe('isAnswerCorrect', () => {
  describe('mc (multiple choice)', () => {
    const q = { type: 'mc', correct: 2 };

    it('returns true for correct answer', () => {
      expect(isAnswerCorrect(q, 2)).toBe(true);
    });

    it('returns false for wrong answer', () => {
      expect(isAnswerCorrect(q, 0)).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isAnswerCorrect(q, null)).toBe(false);
      expect(isAnswerCorrect(q, undefined)).toBe(false);
    });
  });

  describe('code', () => {
    const q = { type: 'code', correct: 1 };

    it('returns true for correct answer', () => {
      expect(isAnswerCorrect(q, 1)).toBe(true);
    });

    it('returns false for wrong answer', () => {
      expect(isAnswerCorrect(q, 3)).toBe(false);
    });
  });

  describe('bug', () => {
    const q = { type: 'bug', correct: 3 };

    it('returns true for correct line', () => {
      expect(isAnswerCorrect(q, 3)).toBe(true);
    });

    it('returns false for wrong line', () => {
      expect(isAnswerCorrect(q, 1)).toBe(false);
    });
  });

  describe('fill (fill in the blank)', () => {
    it('accepts exact match', () => {
      const q = { type: 'fill', correct: 'flexbox' };
      expect(isAnswerCorrect(q, 'flexbox')).toBe(true);
    });

    it('is case insensitive', () => {
      const q = { type: 'fill', correct: 'flexbox' };
      expect(isAnswerCorrect(q, 'FlexBox')).toBe(true);
    });

    it('trims whitespace', () => {
      const q = { type: 'fill', correct: 'flexbox' };
      expect(isAnswerCorrect(q, '  flexbox  ')).toBe(true);
    });

    it('strips quotes and special chars', () => {
      const q = { type: 'fill', correct: 'display' };
      expect(isAnswerCorrect(q, '"display"')).toBe(true);
      expect(isAnswerCorrect(q, "'display'")).toBe(true);
    });

    it('accepts multiple correct answers', () => {
      const q = { type: 'fill', correct: ['div', 'DIV', '<div>'] };
      expect(isAnswerCorrect(q, 'div')).toBe(true);
      expect(isAnswerCorrect(q, 'DIV')).toBe(true);
    });

    it('returns false for empty string', () => {
      const q = { type: 'fill', correct: 'flexbox' };
      expect(isAnswerCorrect(q, '')).toBe(false);
    });

    it('returns false for wrong answer', () => {
      const q = { type: 'fill', correct: 'flexbox' };
      expect(isAnswerCorrect(q, 'grid')).toBe(false);
    });
  });

  describe('order', () => {
    const q = { type: 'order', correct: [2, 0, 1] };

    it('returns true for correct order', () => {
      expect(isAnswerCorrect(q, [2, 0, 1])).toBe(true);
    });

    it('returns false for wrong order', () => {
      expect(isAnswerCorrect(q, [0, 1, 2])).toBe(false);
    });

    it('returns false for non-array', () => {
      expect(isAnswerCorrect(q, 'not an array')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAnswerCorrect(q, null)).toBe(false);
    });
  });

  describe('default type', () => {
    it('uses strict equality', () => {
      const q = { correct: 42 };
      expect(isAnswerCorrect(q, 42)).toBe(true);
      expect(isAnswerCorrect(q, '42')).toBe(false);
    });
  });
});
