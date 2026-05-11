import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DailyLearningLoop } from './DailyLearningLoop';

const steps = [
  { key: 'lesson', label: 'Lesson', state: 'Done', detail: 'Reading saved.', tone: 'done' },
  {
    key: 'review',
    label: 'Review',
    state: '2 due',
    detail: 'Clear review.',
    tone: 'attention',
    isCurrent: true,
  },
];

describe('DailyLearningLoop', () => {
  it('renders learner workflow steps and actions', () => {
    const onOpenReview = vi.fn();
    const onOpenChallenges = vi.fn();

    render(
      <DailyLearningLoop
        steps={steps}
        onOpenReview={onOpenReview}
        onOpenChallenges={onOpenChallenges}
      />,
    );

    expect(screen.getByRole('region', { name: /today's learning loop/i })).toHaveTextContent('Keep progress useful');
    expect(screen.getByText('2 due')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /learning flow steps/i });
    const reviewStep = within(list).getByText('Review').closest('li');
    expect(reviewStep).toHaveAttribute('aria-current', 'step');
    expect(reviewStep).toHaveTextContent('Current');

    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    fireEvent.click(screen.getByRole('button', { name: /challenges/i }));

    expect(onOpenReview).toHaveBeenCalledTimes(1);
    expect(onOpenChallenges).toHaveBeenCalledTimes(1);
  });

  it('does not render inert action buttons when handlers are absent', () => {
    render(<DailyLearningLoop steps={steps} />);

    expect(screen.queryByRole('button', { name: /review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /challenges/i })).not.toBeInTheDocument();
  });
});
