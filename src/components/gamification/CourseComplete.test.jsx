import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseComplete } from './CourseComplete';

vi.mock('../../utils/certificate', () => ({
  generateCertificate: vi.fn(),
}));

vi.mock('../shared/Toast', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

const course = {
  id: 'html',
  label: 'HTML Foundations',
  icon: '<>',
  accent: '#ff6b9d',
};

describe('CourseComplete', () => {
  it('frames completion PDFs as learner exports, not verified credentials', () => {
    render(
      <CourseComplete
        isOpen
        onClose={vi.fn()}
        course={course}
        displayName="Jenna"
        lessonCount={12}
      />,
    );

    expect(screen.getAllByText(/learner export/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not a verified credential/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download learner export/i }),
    ).toBeInTheDocument();
  });
});
