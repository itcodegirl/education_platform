// ═══════════════════════════════════════════════
// MARKDOWN RENDERER TESTS — Proves that the
// DOMPurify sanitizer blocks XSS vectors while
// still preserving legitimate formatting.
// ═══════════════════════════════════════════════

import { describe, test, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderMarkdown } from '../../src/utils/markdown.jsx';

function renderAll(input) {
  return renderToStaticMarkup(<>{renderMarkdown(input)}</>);
}

// Parse the static markup into a real DOM tree so we can assert on actual
// elements rather than substring matches (escaped text like "&lt;script&gt;"
// is inert and never executes).
function renderToDom(input) {
  const root = document.createElement('div');
  root.innerHTML = renderAll(input);
  return root;
}

describe('renderMarkdown', () => {
  test('wraps each block in a <p class="lp">', () => {
    const html = renderAll('first block\n\nsecond block');
    expect(html).toBe('<p class="lp">first block</p><p class="lp">second block</p>');
  });

  test('renders bold, italic, and inline code', () => {
    const html = renderAll('**bold** and *italic* and `code`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code class="ic">code</code>');
  });

  // The pipeline escapes HTML first, then runs the result through DOMPurify
  // with an allow-list of <strong>/<em>/<code>/<br>. Anything malicious
  // survives only as inert text content, never as a real DOM element.
  test('neutralizes raw <script> tags (no <script> elements rendered)', () => {
    const dom = renderToDom('hello <script>alert(1)</script> world');
    expect(dom.querySelectorAll('script')).toHaveLength(0);
    expect(dom.textContent).toContain('hello');
    expect(dom.textContent).toContain('world');
  });

  test('neutralizes anchor injections with javascript: hrefs and on* handlers', () => {
    const dom = renderToDom('<a href="javascript:alert(1)" onclick="alert(2)">click</a>');
    expect(dom.querySelectorAll('a')).toHaveLength(0);
    // Confirm no element anywhere in the tree has onclick/onerror attributes.
    for (const el of dom.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        expect(attr.name.startsWith('on')).toBe(false);
      }
    }
  });

  test('neutralizes <img onerror=…> vectors', () => {
    const dom = renderToDom('<img src=x onerror="alert(1)">');
    expect(dom.querySelectorAll('img')).toHaveLength(0);
  });

  test('does not allow disallowed tags like <iframe>', () => {
    const dom = renderToDom('<iframe src="https://evil.example"></iframe>');
    expect(dom.querySelectorAll('iframe')).toHaveLength(0);
  });

  test('converts bullet lists to <br/>• prefixes', () => {
    const html = renderAll('items:\n- one\n- two');
    expect(html).toContain('items:');
    expect(html).toMatch(/•\s*one/);
    expect(html).toMatch(/•\s*two/);
  });
});
