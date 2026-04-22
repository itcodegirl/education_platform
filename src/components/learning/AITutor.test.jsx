import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITutor } from './AITutor';

const { askLessonTutorMock } = vi.hoisted(() => ({
  askLessonTutorMock: vi.fn(),
}));

vi.mock('../../services/aiService', () => ({
  askLessonTutor: (...args) => askLessonTutorMock(...args),
}));

const lesson = {
  id: 'lesson-1',
  title: 'Intro to HTML',
  concepts: ['elements'],
};

function setOnlineState(isOnline) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: isOnline,
  });
}

describe('AITutor', () => {
  beforeEach(() => {
    askLessonTutorMock.mockReset();
    askLessonTutorMock.mockResolvedValue('A short answer');
    setOnlineState(true);
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('shows a visible message limit and live character count', () => {
    render(<AITutor lesson={lesson} moduleTitle="Foundations" courseId="html" />);

    fireEvent.click(screen.getByRole('button', { name: /ai tutor/i }));
    const input = screen.getByPlaceholderText(/ask about this lesson/i);
    fireEvent.change(input, { target: { value: 'hello' } });

    expect(input).toHaveAttribute('maxLength', '4000');
    expect(screen.getByText('5 / 4,000')).toBeInTheDocument();
    expect(
      screen.getByText(/Messages can be up to 4,000 characters/i),
    ).toBeInTheDocument();
  });

  it('blocks submit and explains next step when offline', () => {
    setOnlineState(false);
    render(<AITutor lesson={lesson} moduleTitle="Foundations" courseId="html" />);

    fireEvent.click(screen.getByRole('button', { name: /ai tutor/i }));
    const input = screen.getByPlaceholderText(/ask about this lesson/i);
    fireEvent.change(input, { target: { value: 'Can you help me?' } });
    const sendButton = screen.getByRole('button', { name: /send message to ai tutor/i });

    expect(sendButton).toBeDisabled();
    expect(askLessonTutorMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Offline: reconnect to send a question\./i),
    ).toBeInTheDocument();
  });

  it('maps 413 payload failures to a clear, actionable tutor message', async () => {
    askLessonTutorMock.mockRejectedValueOnce(new Error('[413] payload too large'));
    render(<AITutor lesson={lesson} moduleTitle="Foundations" courseId="html" />);

    fireEvent.click(screen.getByRole('button', { name: /ai tutor/i }));
    const input = screen.getByPlaceholderText(/ask about this lesson/i);
    fireEvent.change(input, { target: { value: 'Please explain everything in detail' } });
    fireEvent.click(screen.getByRole('button', { name: /send message to ai tutor/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/too long for the tutor context/i).length,
      ).toBeGreaterThan(0);
    });
  });
});
