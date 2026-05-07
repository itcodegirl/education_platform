/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichLessonBody } from './RichLessonBody';

vi.mock('./CodePreview', () => ({
  CodePreview: () => <div data-testid="code-preview">code</div>,
}));

vi.mock('../../utils/markdown', () => ({
  renderMarkdown: (text) => <p data-testid="markdown">{text}</p>,
}));

const richLesson = {
  title: 'Practice loops',
  concepts: ['Loops repeat work', 'For-loops use a counter'],
  output: 'A list of numbers in the console',
  tasks: ['Print 1 to 5', 'Print only evens'],
  tip: 'Use i+= 2 for evens',
  challenge: 'Print the multiplication table for 7',
  devFession: 'I forgot to increment i and the page froze.',
};

describe('RichLessonBody heading hierarchy', () => {
  it('section titles render as h2 only — no h1 or h3 leaks', () => {
    render(
      <RichLessonBody
        lesson={richLesson}
        lang="js"
        scaffolding="full"
        codeForPreview="for (let i = 0; i < 5; i++) {}"
        checkedTasks={new Set()}
        onToggleTask={() => {}}
        showDevFession={false}
        onToggleDevFession={() => {}}
      />,
    );

    // The lesson's <h1> is owned by <LessonHeader>, so RichLessonBody
    // must not emit any h1 of its own.
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);

    // No h3 leak: every section title is an h2 so an SR user reading
    // the document outline sees a flat h2 list under the lesson title.
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

    const h2 = screen.getAllByRole('heading', { level: 2 });
    expect(h2.length).toBeGreaterThanOrEqual(1);
    expect(h2.map((node) => node.textContent.trim())).toEqual(
      expect.arrayContaining(['Core ideas']),
    );
  });

  it('does not render Core ideas when the lesson has no concepts', () => {
    render(
      <RichLessonBody
        lesson={{ title: 'Markdown only', content: 'Some prose.' }}
        lang="js"
        scaffolding="full"
        codeForPreview=""
        checkedTasks={new Set()}
        onToggleTask={() => {}}
        showDevFession={false}
        onToggleDevFession={() => {}}
      />,
    );

    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('Dev_Fession toggle is reachable as a button with aria-expanded', () => {
    render(
      <RichLessonBody
        lesson={richLesson}
        lang="js"
        scaffolding="full"
        codeForPreview=""
        checkedTasks={new Set()}
        onToggleTask={() => {}}
        showDevFession={false}
        onToggleDevFession={() => {}}
      />,
    );

    const toggle = screen.getByRole('button', { name: /dev_fession/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
