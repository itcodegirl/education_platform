import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SRPanel } from './SRPanel';

const { mockUseSR } = vi.hoisted(() => ({
  mockUseSR: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useSR: () => mockUseSR(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

vi.mock('../../services/practiceService', () => ({
  generatePracticeCard: vi.fn(),
}));

describe('SRPanel', () => {
  beforeEach(() => {
    mockUseSR.mockReturnValue({
      getDueSRCards: () => [],
      updateSRCard: vi.fn(),
      addToSRQueue: vi.fn(),
      srCards: [],
    });
  });

  it('shows all-caught-up guidance when no cards are due and queue is empty', () => {
    const onClose = vi.fn();
    render(<SRPanel isOpen onClose={onClose} />);

    expect(screen.getByText(/All caught up\./i)).toBeInTheDocument();
    expect(screen.getByText(/No review load yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No review cards are due yet/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to lesson/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows scheduled-later context when queue has cards but none are due', () => {
    mockUseSR.mockReturnValue({
      getDueSRCards: () => [],
      updateSRCard: vi.fn(),
      addToSRQueue: vi.fn(),
      srCards: [{ question: 'q1' }, { question: 'q2' }],
    });

    render(<SRPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/Nothing due now/i)).toBeInTheDocument();
    expect(screen.getByText(/2 later/i)).toBeInTheDocument();
    expect(screen.getByText(/2 cards are scheduled for later\. Nothing needs attention right now\./i)).toBeInTheDocument();
  });

  it('suggests a small review burst when cards are due', () => {
    mockUseSR.mockReturnValue({
      getDueSRCards: () => [
        {
          question: 'What tag creates a paragraph?',
          source: 'Quick Check',
          options: ['<p>', '<h1>'],
          correct: 0,
        },
      ],
      updateSRCard: vi.fn(),
      addToSRQueue: vi.fn(),
      srCards: [
        { question: 'What tag creates a paragraph?', nextReview: 0 },
        { question: 'What tag creates a link?', nextReview: Date.now() + 1000 },
      ],
    });

    render(<SRPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/1 due now/i)).toBeInTheDocument();
    expect(screen.getByText(/Do 1 card in this burst/i)).toBeInTheDocument();
    expect(screen.getByText(/1 later/i)).toBeInTheDocument();
  });

  it('shows the local-first progress sync scope', () => {
    render(<SRPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/review queue, and challenges are single-device today/i)).toBeInTheDocument();
  });
});

