import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
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
  }),
}));

vi.mock('../shared/Logo', () => ({
  Logo: () => <span>Cinova</span>,
}));

vi.mock('./LandingHero', () => ({
  LandingHeroIntro: ({ onStart }) => (
    <button type="button" onClick={onStart}>
      Start learning
    </button>
  ),
  LandingHeroStory: () => <div>Story</div>,
}));

describe('AuthPage accessibility', () => {
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

  it('has no detectable accessibility violations on the default auth state', async () => {
    const { container } = render(<AuthPage onPreview={vi.fn()} />);
    await screen.findByRole('tab', { name: /login/i });
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
