import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseComplete } from './CourseComplete';

vi.mock('../../utils/certificate', () => ({
  generateCertificate: vi.fn(),
}));

vi.mock('../shared/Toast', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

const course = {
  id: 'html',
  label: 'HTML',
  accent: '#ff6b9d',
  icon: 'H',
};

describe('CourseComplete', () => {
  it('describes completion export scope without verification claims', () => {
    render(
      <CourseComplete
        isOpen
        onClose={vi.fn()}
        course={course}
        displayName="Ada"
        lessonCount={12}
      />,
    );

    expect(screen.getByText(/Portfolio completion certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/not server-authoritative yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download completion certificate/i })).toBeInTheDocument();
    expect(screen.queryByText(/verified certificate/i)).not.toBeInTheDocument();
  });
});
