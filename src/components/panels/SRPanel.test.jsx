import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    render(<SRPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/All caught up\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Complete quizzes or generate a fresh card/i),
    ).toBeInTheDocument();
  });

  it('shows scheduled-later context when queue has cards but none are due', () => {
    mockUseSR.mockReturnValue({
      getDueSRCards: () => [],
      updateSRCard: vi.fn(),
      addToSRQueue: vi.fn(),
      srCards: [{ question: 'q1' }, { question: 'q2' }],
    });

    render(<SRPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/2 cards are scheduled for later\./i)).toBeInTheDocument();
  });
});

