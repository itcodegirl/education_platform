import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useLearnerLocalStorage } from './useLearnerLocalStorage';
import { getLearnerStorageKey } from '../utils/learnerStorageKeys';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('../providers', () => ({
  useAuth: () => mockUseAuth(),
}));

function StorageHarness({ baseKey, initialValue, nextValue }) {
  const [value, setValue] = useLearnerLocalStorage(baseKey, initialValue);

  return (
    <>
      <output data-testid="value">{JSON.stringify(value)}</output>
      <button type="button" onClick={() => setValue(nextValue)}>
        write
      </button>
    </>
  );
}

describe('useLearnerLocalStorage', () => {
  beforeEach(() => {
    const values = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: vi.fn((key) => (values.has(key) ? values.get(key) : null)),
        setItem: vi.fn((key, value) => values.set(key, String(value))),
        removeItem: vi.fn((key) => values.delete(key)),
        clear: vi.fn(() => values.clear()),
      },
    });
    window.localStorage.clear();
    mockUseAuth.mockReturnValue({ user: null });
  });

  it('scopesLessonTaskStateByLearner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'learner-a' } });

    render(
      <StorageHarness
        baseKey="chw-tasks"
        initialValue={{}}
        nextValue={{ 'lesson-a': [0] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /write/i }));

    expect(window.localStorage.getItem('chw-tasks')).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem(getLearnerStorageKey('chw-tasks', 'learner-a'))),
    ).toEqual({ 'lesson-a': [0] });
    expect(window.localStorage.getItem(getLearnerStorageKey('chw-tasks', 'learner-b'))).toBeNull();
  });

  it('scopesOnboardingAndLockModeByLearner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'learner-a' } });

    const { rerender } = render(
      <StorageHarness baseKey="chw-onboarded" initialValue={false} nextValue={true} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /write/i }));

    rerender(
      <StorageHarness baseKey="chw-lock-mode" initialValue={false} nextValue={true} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /write/i }));

    expect(JSON.parse(window.localStorage.getItem(getLearnerStorageKey('chw-onboarded', 'learner-a')))).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(getLearnerStorageKey('chw-lock-mode', 'learner-a')))).toBe(true);
    expect(window.localStorage.getItem(getLearnerStorageKey('chw-onboarded', 'learner-b'))).toBeNull();
    expect(window.localStorage.getItem(getLearnerStorageKey('chw-lock-mode', 'learner-b'))).toBeNull();
  });

  it('migrates legacy learner storage once an authenticated learner is known', () => {
    window.localStorage.setItem('chw-onboarded', JSON.stringify(true));
    mockUseAuth.mockReturnValue({ user: { id: 'learner-a' } });

    render(
      <StorageHarness baseKey="chw-onboarded" initialValue={false} nextValue={false} />,
    );

    expect(screen.getByTestId('value')).toHaveTextContent('true');
    expect(JSON.parse(window.localStorage.getItem(getLearnerStorageKey('chw-onboarded', 'learner-a')))).toBe(true);
    expect(window.localStorage.getItem('chw-onboarded')).toBeNull();
  });

  it('uses a guest namespace for signed-out preview state', () => {
    render(
      <StorageHarness baseKey="chw-lock-mode" initialValue={false} nextValue={true} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /write/i }));

    expect(JSON.parse(window.localStorage.getItem(getLearnerStorageKey('chw-lock-mode', null)))).toBe(true);
    expect(window.localStorage.getItem('chw-lock-mode')).toBeNull();
  });
});
