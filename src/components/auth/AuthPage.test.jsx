import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthPage } from './AuthPage';

const {
  signInMock,
  signUpMock,
  signInWithGithubMock,
  signInWithGoogleMock,
  forgotPasswordMock,
} = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  signInWithGithubMock: vi.fn(),
  signInWithGoogleMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
    signInWithGithub: signInWithGithubMock,
    signInWithGoogle: signInWithGoogleMock,
    forgotPassword: forgotPasswordMock,
  }),
}));

vi.mock('../shared/Logo', () => ({
  Logo: () => <span>CodeHerWay</span>,
}));

vi.mock('./LandingHero', () => ({
  LandingHeroIntro: ({ onStart }) => (
    <button type="button" onClick={onStart}>
      Start learning
    </button>
  ),
  LandingHeroStory: () => <div>Story</div>,
}));

describe('AuthPage', () => {
  beforeEach(() => {
    signInMock.mockReset();
    signUpMock.mockReset();
    signInWithGithubMock.mockReset();
    signInWithGoogleMock.mockReset();
    forgotPasswordMock.mockReset();

    signInMock.mockResolvedValue({ error: null });
    signUpMock.mockResolvedValue({ error: null });
    forgotPasswordMock.mockResolvedValue({ error: null });

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: (callback) => callback(),
    });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('shows inline password progress while the user types', () => {
    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /login/i }));
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'abc' } });

    expect(
      screen.getByText(/3\/6 characters\. Add 3 more to continue\./i),
    ).toBeInTheDocument();
  });

  it('prevents reset flow when forgot-password email format is invalid', () => {
    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /login/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));

    expect(forgotPasswordMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Enter a valid account email, then select Forgot password\./i),
    ).toBeInTheDocument();
  });

  it('sends reset email and shows next-step guidance when email is valid', async () => {
    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /login/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'learner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith('learner@example.com');
    });
    expect(
      screen.getByText(/Password reset link sent to learner@example.com\./i),
    ).toBeInTheDocument();
  });
});
