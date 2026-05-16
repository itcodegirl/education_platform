import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders actionable content QA gaps for admins', async () => {
    render(<AdminContentQualityTab />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading content quality/i);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Content Quality' })).toBeInTheDocument();
    });

    expect(screen.getByText('Quiz rubric gaps')).toBeInTheDocument();
    expect(screen.getByText('Lesson rubric gaps')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /qa progress/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /suggested next sprint/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /highest priority fixes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /report filters/i })).toBeInTheDocument();
    const exportLink = screen.getByRole('link', { name: /export csv/i });
    expect(exportLink).toHaveAttribute('download', 'codeherway-content-quality-report.csv');
    expect(exportLink).toHaveAttribute('href', expect.stringContaining('data:text/csv'));
    const filteredExportLink = screen.getByRole('link', { name: /export filtered fixes/i });
    expect(filteredExportLink).toHaveAttribute('download', 'codeherway-filtered-content-fixes.csv');
    expect(filteredExportLink).toHaveAttribute('href', expect.stringContaining('data:text/csv'));
    expect(screen.getAllByText(/HTML - Lesson intro/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Add one question/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Misconception quiz item/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No previous scan/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/search quality fixes/i), {
      target: { value: 'does-not-match' },
    });

    expect(screen.getByText(/No priority fixes found/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getAllByText(/HTML - Lesson intro/).length).toBeGreaterThan(0);
  });
});
