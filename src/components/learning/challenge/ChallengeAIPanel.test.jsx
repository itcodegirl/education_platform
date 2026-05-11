import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChallengeAIPanel } from './ChallengeAIPanel';

vi.mock('../../../services/aiService', () => ({
  AI_ERROR_CODES: {
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    NETWORK: 'NETWORK',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    RATE_LIMITED: 'RATE_LIMITED',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    UNKNOWN: 'UNKNOWN',
  },
  askChallengeTutor: vi.fn(),
}));

const challenge = {
  title: 'Render a heading',
  description: 'Create an h1 element in the preview.',
  requirements: ['Use a semantic h1'],
};

describe('ChallengeAIPanel', () => {
  it('labels the custom tutor question field and region', () => {
    render(
      <ChallengeAIPanel
        challenge={challenge}
        monacoLang="html"
        code="<div></div>"
        results={[]}
        isOpen
      />,
    );

    expect(screen.getByRole('region', { name: /ai tutor/i })).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: /ask about this challenge/i });
    expect(input).toHaveAccessibleDescription(/ask for challenge guidance/i);
  });
});
