import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopbarLearnerStatus } from './TopbarLearnerStatus';
import { PROGRESS_SYNC_SHORT } from '../../constants/progressCopy';

describe('TopbarLearnerStatus', () => {
  it('marks the level pill as device-only via its title', () => {
    render(
      <TopbarLearnerStatus
        learnerName="Ada"
        readTime="5 min"
        showModQuiz={false}
        xpTotal={120}
        level={3}
        coursePct={40}
        streak={4}
        pausedStreak={null}
        dailyCount={2}
      />,
    );

    expect(screen.getByLabelText('Level 3')).toHaveAttribute(
      'title',
      expect.stringContaining(PROGRESS_SYNC_SHORT),
    );
    expect(screen.getByLabelText('4 day streak')).toHaveAttribute(
      'title',
      expect.stringContaining(PROGRESS_SYNC_SHORT),
    );
    expect(screen.getByLabelText('Lessons done today: 2')).toHaveAttribute(
      'title',
      expect.stringContaining(PROGRESS_SYNC_SHORT),
    );
  });

  it('keeps the streak-recovery hint on the paused pill and still notes device-only scope', () => {
    render(
      <TopbarLearnerStatus
        learnerName="Ada"
        readTime="5 min"
        showModQuiz={false}
        xpTotal={0}
        level={1}
        coursePct={0}
        streak={0}
        pausedStreak={{ days: 6 }}
        dailyCount={0}
      />,
    );

    const paused = screen.getByLabelText('6 day streak paused');
    expect(paused).toHaveAttribute('title', expect.stringContaining('Pick up your streak'));
    expect(paused).toHaveAttribute('title', expect.stringContaining(PROGRESS_SYNC_SHORT));
  });
});
