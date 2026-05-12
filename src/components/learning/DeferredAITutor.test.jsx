import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeferredAITutor } from './DeferredAITutor';

vi.mock('./AITutor', () => ({
  AITutor: ({ initialOpen }) => (
    <div data-testid="loaded-ai-tutor">
      {initialOpen ? 'Tutor opened' : 'Tutor closed'}
    </div>
  ),
}));

describe('DeferredAITutor', () => {
  it('loads the full tutor only after the learner asks for it', async () => {
    render(
      <DeferredAITutor
        lesson={{ id: 'lesson-1', title: 'Intro' }}
        moduleTitle="Foundations"
        courseId="html"
      />,
    );

    expect(screen.queryByTestId('loaded-ai-tutor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ai tutor/i }));

    expect(await screen.findByTestId('loaded-ai-tutor')).toHaveTextContent('Tutor opened');
  });
});
