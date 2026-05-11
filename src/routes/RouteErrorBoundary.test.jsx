import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const {
  mockIsRouteErrorResponse,
  mockNavigate,
  mockUseRouteError,
} = vi.hoisted(() => ({
  mockIsRouteErrorResponse: vi.fn(),
  mockNavigate: vi.fn(),
  mockUseRouteError: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  isRouteErrorResponse: mockIsRouteErrorResponse,
  useNavigate: () => mockNavigate,
  useRouteError: mockUseRouteError,
}));

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    mockIsRouteErrorResponse.mockReset();
    mockIsRouteErrorResponse.mockImplementation((error) => Boolean(error?.routeError));
    mockNavigate.mockReset();
    mockUseRouteError.mockReset();
  });

  it('announces unexpected route errors and moves focus to the title', async () => {
    mockUseRouteError.mockReturnValue(new Error('boom'));

    render(<RouteErrorBoundary />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAccessibleName('Unexpected app error');
    expect(alert).toHaveAccessibleDescription(/safely return to the dashboard/i);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /unexpected app error/i })).toHaveFocus();
    });
  });

  it('keeps recovery actions clear for route response errors', () => {
    mockUseRouteError.mockReturnValue({
      routeError: true,
      status: 405,
      statusText: 'Method Not Allowed',
    });

    render(<RouteErrorBoundary />);

    expect(screen.getByText(/No progress was lost/i)).toBeInTheDocument();
    expect(screen.getByText(/405 Method Not Allowed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /return to dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
