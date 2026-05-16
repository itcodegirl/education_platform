import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminOverviewTab } from './AdminOverviewTab';

function renderOverview(overrides = {}) {
  render(
    <AdminOverviewTab
      totalUsers={1}
      newUsersWeek={1}
      newUsersMonth={1}
      activeUsers={1}
      totalCompletions={1}
      totalQuizAttempts={1}
      totalBadges={0}
      totalXP={100}
      courseStats={[]}
      topUsers={[]}
      funnel7d={{ resumeNextActionClicked: 2 }}
      funnel30d={{ resumeNextActionClicked: 5 }}
      reliability7d={{ serviceWorkerFailures: 1, offlineFallbacks: 2 }}
      reliability30d={{ serviceWorkerEvents: 9, currentLessonCached: 4 }}
      {...overrides}
    />,
  );
}

describe('AdminOverviewTab', () => {
  it('shows service-worker reliability signals beside product funnel data', () => {
    renderOverview();

    expect(screen.getByRole('heading', { name: /platform reliability/i })).toBeInTheDocument();
    expect(screen.getByText('Service-worker failures')).toBeInTheDocument();
    expect(screen.getByText('Offline fallbacks')).toBeInTheDocument();
    expect(screen.getByText('Current lessons cached')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
