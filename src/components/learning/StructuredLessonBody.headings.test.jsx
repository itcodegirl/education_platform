/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RichLessonBody } from './RichLessonBody';
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

  it('keeps section and box labels calm without decorative emoji wrappers', () => {
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

    // Section and box labels should stand on text alone so lesson
    // hierarchy stays calm and screen-reader output stays direct.
    expect(container.querySelectorAll('.sl-section-title span[aria-hidden="true"]')).toHaveLength(0);
    expect(container.querySelectorAll('.box-label span[aria-hidden="true"]')).toHaveLength(0);
  });

  it('keeps structured challenge requirements as native focusable checkboxes', () => {
    const onToggleTask = vi.fn();
    const { container } = render(
      <StructuredLessonBody
        lesson={lesson}
        lang="html"
        scaffolding="full"
        codeForPreview=""
        checkedTasks={new Set()}
        onToggleTask={onToggleTask}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /has a button/i });
    checkbox.focus();
    expect(checkbox).toHaveFocus();

    fireEvent.click(checkbox);
    expect(onToggleTask).toHaveBeenCalledWith('ch-0');
    expect(container.querySelector('.task-check')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps rich lesson tasks as native focusable checkboxes', () => {
    const onToggleTask = vi.fn();

    render(
      <RichLessonBody
        lesson={{ title: 'Practice', tasks: ['Add a label'] }}
        lang="html"
        scaffolding="full"
        codeForPreview=""
        checkedTasks={new Set()}
        onToggleTask={onToggleTask}
        showDevFession={false}
        onToggleDevFession={() => {}}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /add a label/i });
    checkbox.focus();
    expect(checkbox).toHaveFocus();

    fireEvent.click(checkbox);
    expect(onToggleTask).toHaveBeenCalledWith(0);
  });
});
