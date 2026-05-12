import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LessonEvidencePanel } from './LessonEvidencePanel';

describe('LessonEvidencePanel', () => {
  it('shows a compact learning contract before progress evidence', () => {
    render(
      <LessonEvidencePanel
        lesson={{
          title: 'Accessible Forms',
          prereqs: ['h12-1'],
          hook: {
            accomplishments: ['Build a labeled form field.'],
          },
          do: {
            steps: ['Add a label'],
            proofRequired: 'a screen-reader friendly input',
          },
          understand: {
            concepts: [{ name: 'Label association' }],
          },
        }}
        isLessonDone={false}
        masteryStatus={{ isReady: false }}
        syncStatus={{ tone: 'idle' }}
      />,
    );

    expect(screen.getByRole('region', { name: /what counts as progress here/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/lesson learning contract/i)).toHaveTextContent('Prerequisite');
    expect(screen.getByLabelText(/lesson learning contract/i)).toHaveTextContent('Outcome');
    expect(screen.getByLabelText(/lesson learning contract/i)).toHaveTextContent('Guided practice');
    expect(screen.getByLabelText(/lesson learning contract/i)).toHaveTextContent('Recall check');
    expect(screen.getByLabelText(/lesson learning contract/i)).toHaveTextContent('Proof / transfer');
    expect(screen.getByText(/Build a labeled form field/i)).toBeInTheDocument();
    expect(screen.getByText(/screen-reader friendly input/i)).toBeInTheDocument();
  });
});
