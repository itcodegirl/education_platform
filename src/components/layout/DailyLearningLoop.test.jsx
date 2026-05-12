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
    const onAction = vi.fn();

    render(
      <DailyLearningLoop
        steps={steps}
        onOpenReview={onOpenReview}
        onOpenChallenges={onOpenChallenges}
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('region', { name: /today's learning loop/i })).toHaveTextContent('One next honest step');
    expect(screen.getByText(/review: 2 due/i)).toBeInTheDocument();
    expect(screen.getByText('2 due')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /learning path overview/i });
    const reviewStep = within(list).getByText('Review').closest('li');
    expect(reviewStep).toHaveAttribute('aria-current', 'step');
    expect(reviewStep).toHaveTextContent('Current');

    fireEvent.click(screen.getByRole('button', { name: /open review queue/i }));

    expect(onOpenReview).toHaveBeenCalledTimes(1);
    expect(onOpenChallenges).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith('review');
  });

  it('does not render inert action buttons when handlers are absent', () => {
    render(<DailyLearningLoop steps={steps} />);

    expect(screen.queryByRole('button', { name: /review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /challenges/i })).not.toBeInTheDocument();
  });

  it('uses challenges as the only action when application is current', () => {
    const onOpenChallenges = vi.fn();
    const onAction = vi.fn();

    render(
      <DailyLearningLoop
        steps={[
          { key: 'lesson', label: 'Lesson', state: 'Done', detail: 'Saved.', tone: 'done' },
          { key: 'apply', label: 'Apply', state: 'Challenge', detail: 'Prove the skill.', tone: 'neutral', isCurrent: true },
        ]}
        onOpenReview={vi.fn()}
        onOpenChallenges={onOpenChallenges}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /open challenges/i }));

    expect(onOpenChallenges).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith('challenges');
  });
});
