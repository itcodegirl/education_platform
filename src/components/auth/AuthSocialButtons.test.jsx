/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthSocialButtons } from './AuthSocialButtons';

describe('AuthSocialButtons', () => {
  it('renders both providers and routes clicks through onSignIn(name, fn)', () => {
    const onSignIn = vi.fn();
    const githubFn = vi.fn();
    const googleFn = vi.fn();
    render(
      <AuthSocialButtons
        onSignIn={onSignIn}
        signInWithGithub={githubFn}
        signInWithGoogle={googleFn}
        socialLoading=""
        disabled={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /continue with github/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(onSignIn).toHaveBeenNthCalledWith(1, 'GitHub', githubFn);
    expect(onSignIn).toHaveBeenNthCalledWith(2, 'Google', googleFn);
  });

  it('shows the per-provider loading label when socialLoading matches', () => {
    const { rerender } = render(
      <AuthSocialButtons
        onSignIn={() => {}}
        signInWithGithub={() => {}}
        signInWithGoogle={() => {}}
        socialLoading="GitHub"
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: /continue with github/i })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/opening github\.\.\./i)).toBeInTheDocument();

    rerender(
      <AuthSocialButtons
        onSignIn={() => {}}
        signInWithGithub={() => {}}
        signInWithGoogle={() => {}}
        socialLoading="Google"
        disabled
      />,
    );
    expect(screen.getByText(/opening google\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toHaveAttribute('aria-busy', 'true');
  });

  it('disables both buttons when disabled is true', () => {
    render(
      <AuthSocialButtons
        onSignIn={() => {}}
        signInWithGithub={() => {}}
        signInWithGoogle={() => {}}
        socialLoading=""
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: /continue with github/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled();
  });
});
