import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthPage } from './AuthPage';

const {
  signInMock,
  signUpMock,
  signInWithGithubMock,
  signInWithGoogleMock,
  forgotPasswordMock,
  authBackendReadyMock,
} = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  signInWithGithubMock: vi.fn(),
  signInWithGoogleMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
  authBackendReadyMock: { value: true },
}));

vi.mock('../../providers', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggle: vi.fn(),
  }),
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
    signInWithGithub: signInWithGithubMock,
    signInWithGoogle: signInWithGoogleMock,
    forgotPassword: forgotPasswordMock,
    authBackendReady: authBackendReadyMock.value,
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
    authBackendReadyMock.value = true;

    signInMock.mockResolvedValue({ error: null });
    signUpMock.mockResolvedValue({ error: null });
    signInWithGithubMock.mockResolvedValue({ error: null });
    signInWithGoogleMock.mockResolvedValue({ error: null });
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
      screen.getByText(/3\/8 characters\. Add 5 more to continue\./i),
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

  it('shows a friendly social sign-in error when OAuth cannot start', async () => {
    signInWithGithubMock.mockRejectedValueOnce(new Error('provider unavailable'));

    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /continue with github/i }));

    await waitFor(() => {
      expect(signInWithGithubMock).toHaveBeenCalled();
    });
    expect(
      screen.getByText(/Unable to continue with GitHub right now/i),
    ).toBeInTheDocument();
  });

  it('keeps preview available and disables auth controls when the backend is not configured', () => {
    const onPreview = vi.fn();
    authBackendReadyMock.value = false;

    render(<AuthPage onPreview={onPreview} />);

    expect(
      screen.getByText(/Account features are not configured in this build/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /^create free account$/i })).toBeDisabled();

    const previewButton = screen.getByRole('button', { name: /preview a lesson before signing in/i });
    expect(previewButton).toBeEnabled();
    fireEvent.click(previewButton);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});


