/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderMarkdown } from './markdown';

function renderMd(text) {
  const { container } = render(<>{renderMarkdown(text)}</>);
  return container;
}

describe('renderMarkdown', () => {
  it('returns an array', () => {
    expect(Array.isArray(renderMarkdown('hello'))).toBe(true);
  });

  it('renders plain text in a paragraph', () => {
    const c = renderMd('hello world');
    expect(c.querySelector('p').textContent).toBe('hello world');
  });

  it('handles null without throwing', () => {
    expect(() => renderMarkdown(null)).not.toThrow();
  });

  it('handles undefined without throwing', () => {
    expect(() => renderMarkdown(undefined)).not.toThrow();
  });

  it('escapes raw HTML to prevent XSS', () => {
    const c = renderMd('<script>alert(1)</script>');
    expect(c.innerHTML).not.toContain('<script>');
    expect(c.innerHTML).toContain('&lt;script&gt;');
  });

  it('escapes angle brackets in text', () => {
    const c = renderMd('<div>');
    expect(c.textContent).toContain('<div>');
  });

  it('renders **text** as <strong>', () => {
    const c = renderMd('**bold**');
    expect(c.querySelector('strong')).toBeTruthy();
    expect(c.querySelector('strong').textContent).toBe('bold');
  });

  it('renders *text* as <em>', () => {
    const c = renderMd('*italic*');
    expect(c.querySelector('em')).toBeTruthy();
    expect(c.querySelector('em').textContent).toBe('italic');
  });

  it('renders `code` as <code>', () => {
    const c = renderMd('`const x = 1;`');
    expect(c.querySelector('code')).toBeTruthy();
    expect(c.querySelector('code').textContent).toBe('const x = 1;');
  });

  it('splits on double newline into multiple paragraphs', () => {
    const c = renderMd('first\n\nsecond');
    expect(c.querySelectorAll('p')).toHaveLength(2);
  });

  it('a single block produces exactly one paragraph', () => {
    const c = renderMd('only one block');
    expect(c.querySelectorAll('p')).toHaveLength(1);
  });

  it('does not inject event handlers from input', () => {
    const c = renderMd('<img onerror="alert(1)" src="x">');
    expect(c.innerHTML).not.toContain('onerror');
  });
});
