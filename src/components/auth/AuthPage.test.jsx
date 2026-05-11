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

vi.mock('../../providers/AuthProvider', () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
    signInWithGithub: signInWithGithubMock,
    signInWithGoogle: signInWithGoogleMock,
    forgotPassword: forgotPasswordMock,
    authBackendReady: authBackendReadyState.value,
  }),
}));

vi.mock('../../providers/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggle: vi.fn(),
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
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
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

  it('marks required auth fields invalid and moves focus to the first invalid field', () => {
    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));

    const emailInput = screen.getByLabelText(/email/i);
    const formSummary = screen
      .getByText(/there is a problem with this form/i)
      .closest('[role="alert"]');

    expect(emailInput).toHaveFocus();
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAccessibleDescription(/email is required/i);
    expect(formSummary).toHaveTextContent(/there is a problem with this form/i);
  });

  it('moves focus to password when password length blocks submission', () => {
    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Jenna' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jenna@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveFocus();
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    expect(passwordInput).toHaveAccessibleDescription(/add 3 more/i);
  });

  it('focuses the form error summary for backend authentication failures', async () => {
    signInMock.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });

    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /login/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jenna@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'validpass' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveFocus();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/email or password is incorrect/i);
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

  it('does not smooth-scroll the auth form when reduced motion is requested', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    window.matchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<AuthPage onPreview={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /start learning/i }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
  });

  it('supports arrow-key navigation between auth tabs', () => {
    render(<AuthPage onPreview={vi.fn()} />);

    const signupTab = screen.getByRole('tab', { name: /create account/i });
    fireEvent.keyDown(signupTab, { key: 'ArrowLeft' });

    expect(screen.getByRole('tab', { name: /login/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /login/i })).toBeInTheDocument();
  });
});


