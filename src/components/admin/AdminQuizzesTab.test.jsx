import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminQuizzesTab } from './AdminQuizzesTab';

describe('AdminQuizzesTab', () => {
  it('surfaces quiz mastery review signals from score history', () => {
    render(
      <AdminQuizzesTab
        quizScores={[
          { quiz_key: 'l:html:intro', score: '4/5' },
          { quiz_key: 'l:html:intro', score: '2/5' },
          { quiz_key: 'l:html:intro', score: '3/5' },
          { quiz_key: 'l:css:flex', score: '5/5' },
        ]}
      />,
    );

    expect(screen.getByRole('columnheader', { name: '80%+ Passes' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Review Need' })).toBeInTheDocument();
    expect(screen.getByText('l:html:intro')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText('2 below 80%')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });
});
