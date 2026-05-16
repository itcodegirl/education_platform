import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminContentQualityTab } from './AdminContentQualityTab';

vi.mock('../../data', () => ({
  COURSE_METADATA: [{ id: 'html', label: 'HTML' }],
  loadCourse: vi.fn(async () => ({
    quizzes: [
      {
        id: 'q1',
        lessonId: 'intro',
        questions: [
          {
            type: 'mc',
            question: 'What tag makes a heading?',
            options: ['h1', 'p'],
            correct: 0,
            explanation: 'h1 is a heading.',
          },
        ],
      },
    ],
    modules: [
      {
        id: 'basics',
        title: 'Basics',
        lessons: [{ id: 'intro', title: 'Intro', content: 'Short note.' }],
      },
    ],
  })),
}));

describe('AdminContentQualityTab', () => {
  it('renders actionable content QA gaps for admins', async () => {
    render(<AdminContentQualityTab />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading content quality/i);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Content Quality' })).toBeInTheDocument();
    });

    expect(screen.getByText('Quiz rubric gaps')).toBeInTheDocument();
    expect(screen.getByText('Lesson rubric gaps')).toBeInTheDocument();
    expect(screen.getByText(/HTML - Lesson intro/)).toBeInTheDocument();
    expect(screen.getByText(/Add one question/)).toBeInTheDocument();
  });
});
