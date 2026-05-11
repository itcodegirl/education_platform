import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthPage } from './AuthPage';

const {
  signInMock,
  signUpMock,
  signInWithGithubMock,
  signInWithGoogleMock,
  forgotPasswordMock,
  authBackendReadyState,
} = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  signInWithGithubMock: vi.fn(),
  signInWithGoogleMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
  authBackendReadyState: { value: true },
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
    authBackendReady: authBackendReadyState.value,
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
    signInWithGithubMock.mockResolvedValue({ error: null });
    signInWithGoogleMock.mockResolvedValue({ error: null });
    forgotPasswordMock.mockResolvedValue({ error: null });
    authBackendReadyState.value = true;

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

  it('keeps lesson preview available when accounts are not configured', () => {
    authBackendReadyState.value = false;
    const onPreview = vi.fn();

    render(<AuthPage onPreview={onPreview} />);

    expect(
      screen.getByText(/Accounts are not connected in this environment yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create free account/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /preview a lesson before signing in/i }));

    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});


