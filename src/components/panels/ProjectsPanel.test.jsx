import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectsPanel } from './ProjectsPanel';

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

describe('ProjectsPanel', () => {
  it('exposes course filters and project ideas with clear semantics', () => {
    render(
      <ProjectsPanel
        isOpen
        onClose={vi.fn()}
        currentCourse="html"
        hasCompletedProgress
      />,
    );

    expect(screen.getByRole('dialog', { name: /build projects/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /project course tracks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show html projects/i })).toHaveAttribute('aria-pressed', 'true');

    const projectList = screen.getByRole('list', { name: /html project ideas/i });
    expect(within(projectList).getByRole('listitem', { name: /personal bio page/i })).toBeInTheDocument();
    expect(within(projectList).getByRole('heading', { name: /personal bio page/i, level: 3 })).toBeInTheDocument();
  });

  it('updates the active project track without changing the learner path', () => {
    render(
      <ProjectsPanel
        isOpen
        onClose={vi.fn()}
        currentCourse="html"
        hasCompletedProgress
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /show react projects/i }));

    expect(screen.getByRole('button', { name: /show react projects/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: /react project ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /link-in-bio page/i, level: 3 })).toBeInTheDocument();
  });

  it('keeps locked projects framed as a calm next step', () => {
    render(
      <ProjectsPanel
        isOpen
        onClose={vi.fn()}
        currentCourse="html"
        hasCompletedProgress={false}
      />,
    );

    expect(screen.getByText(/projects unlock after your first completed lesson/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to current lesson/i })).toBeInTheDocument();
  });
});
