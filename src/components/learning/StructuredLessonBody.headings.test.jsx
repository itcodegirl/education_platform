/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StructuredLessonBody } from './StructuredLessonBody';

vi.mock('./CodePreview', () => ({
  CodePreview: () => <div data-testid="code-preview">code</div>,
}));

const lesson = {
  hook: { accomplishments: ['Ship something small'] },
  do: {
    title: 'Wire the form',
    steps: ['Step one', 'Step two'],
    result: 'A working form',
  },
  understand: {
    concepts: [
      { name: 'State', definition: 'Data over time', analogy: 'A whiteboard' },
    ],
    keyTakeaway: 'Forms control input.',
  },
  build: {
    goal: 'Add a reset button.',
    hint: 'Use defaultValue.',
  },
  challenge: {
    title: 'Form challenge',
    mission: 'Build it from scratch.',
    requirements: ['Has a button'],
  },
  summary: {
    capabilities: ['Build a form'],
  },
  bridge: { preview: 'Next: validation.' },
};

describe('StructuredLessonBody heading hierarchy', () => {
  it('renders only h2 section titles so the lesson outline goes h1 -> h2 -> h3', () => {
    render(
      <StructuredLessonBody
        lesson={lesson}
        lang="html"
        scaffolding="full"
        codeForPreview="<form></form>"
        checkedTasks={new Set()}
        onToggleTask={() => {}}
      />,
    );

    // No section title may render as h3 — the parent <LessonHeader>
    // already owns h1, so section titles must be h2.
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

    const h2Headings = screen.getAllByRole('heading', { level: 2 });
    const headingNames = h2Headings.map((node) => node.textContent.trim());

    expect(headingNames).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Wire the form/),
        expect.stringMatching(/Understand/),
        expect.stringMatching(/Build on it/),
        expect.stringMatching(/Challenge: Form challenge/),
      ]),
    );
  });

  it('hides decorative emoji from assistive tech', () => {
    const { container } = render(
      <StructuredLessonBody
        lesson={lesson}
        lang="html"
        scaffolding="full"
        codeForPreview="<form></form>"
        checkedTasks={new Set()}
        onToggleTask={() => {}}
      />,
    );

    // Every emoji used as a section / box decoration must be wrapped
    // in a span with aria-hidden so screen readers do not announce
    // "lightbulb Understand" or "fire Challenge: Form challenge".
    const ariaHiddenSpans = container.querySelectorAll('span[aria-hidden="true"]');
    const decorativeText = Array.from(ariaHiddenSpans)
      .map((node) => node.textContent || '')
      .join('');

    expect(decorativeText).toMatch(/💡|🛠️|🔨|🔥/);
  });
});
