/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

const { mockEnsureLoaded, mockIsCourseLoaded } = vi.hoisted(() => ({
  mockEnsureLoaded: vi.fn(),
  mockIsCourseLoaded: vi.fn(),
}));

vi.mock('../../providers/CourseContentProvider', () => ({
  useCourseContent: () => ({
    ensureLoaded: mockEnsureLoaded,
    isCourseLoaded: mockIsCourseLoaded,
  }),
}));

vi.mock('../../utils/markdown', () => ({
  renderMarkdown: (text) => <p data-testid="markdown">{text}</p>,
}));

vi.mock('../learning/CodePreview', () => ({
  CodePreview: ({ code }) => <pre data-testid="code-preview">{code}</pre>,
}));

const MOCK_LESSON = {
  title: 'Your First HTML Page',
  difficulty: 'beginner',
  duration: '5 min',
  code: '<h1>Hello</h1>',
};

const MOCK_MODULE = {
  title: 'HTML Foundations',
  emoji: '📄',
  lessons: [MOCK_LESSON],
};

vi.mock('../../data', () => ({
  COURSES: [
    {
      id: 'html',
      modules: [MOCK_MODULE],
    },
  ],
}));

import { GuestPreview } from './GuestPreview';

describe('GuestPreview', () => {
  beforeEach(() => {
    mockEnsureLoaded.mockReset();
    mockIsCourseLoaded.mockReset();
  });

  it('calls ensureLoaded("html") on mount', () => {
    mockIsCourseLoaded.mockReturnValue(false);
    render(<GuestPreview onBack={vi.fn()} />);
    expect(mockEnsureLoaded).toHaveBeenCalledWith('html');
  });

  it('shows a loading indicator while the HTML course is not yet ready', () => {
    mockIsCourseLoaded.mockReturnValue(false);
    render(<GuestPreview onBack={vi.fn()} />);
    expect(screen.getByText(/opening lesson preview/i)).toBeInTheDocument();
  });

  it('renders the lesson title when the course is loaded', () => {
    mockIsCourseLoaded.mockReturnValue(true);
    render(<GuestPreview onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /your first html page/i })).toBeInTheDocument();
  });

  it('renders the code preview when the lesson has code', () => {
    mockIsCourseLoaded.mockReturnValue(true);
    render(<GuestPreview onBack={vi.fn()} />);
    expect(screen.getByTestId('code-preview')).toHaveTextContent('<h1>Hello</h1>');
  });

  it('calls onBack when the back button is clicked', () => {
    mockIsCourseLoaded.mockReturnValue(true);
    const onBack = vi.fn();
    render(<GuestPreview onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /return to authentication page/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when the CTA "Create free account" button is clicked', () => {
    mockIsCourseLoaded.mockReturnValue(true);
    const onBack = vi.fn();
    render(<GuestPreview onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows difficulty and duration metadata when present', () => {
    mockIsCourseLoaded.mockReturnValue(true);
    render(<GuestPreview onBack={vi.fn()} />);
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText(/5 min/i)).toBeInTheDocument();
  });
});
