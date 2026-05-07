import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseComplete } from './CourseComplete';

vi.mock('../../utils/progressSummary', () => ({
  generateProgressSummary: vi.fn(),
}));

vi.mock('../shared/Toast', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

const course = {
  id: 'html',
  label: 'HTML Foundations',
  icon: '<>',
  accent: '#ff6b9d',
};

describe('CourseComplete', () => {
  it('frames completion PDFs as Progress Summaries, not verified credentials', () => {
    render(
      <CourseComplete
        isOpen
        onClose={vi.fn()}
        course={course}
        displayName="Jenna"
        lessonCount={12}
      />,
    );

    expect(screen.getByText(/^Progress Summary$/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/not server-authoritative yet/i)).toBeInTheDocument();
    expect(screen.getByText(/not a verified credential/i)).toBeInTheDocument();
    expect(screen.getByText(/not a third-party certificate/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download Progress Summary/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share progress/i })).toBeInTheDocument();
  });
});
