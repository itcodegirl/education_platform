// ═══════════════════════════════════════════════
// buildChallengePreview — pure utility that wraps the
// learner's source code into a sandboxed iframe srcDoc.
// Extracted from CodeChallenge so the function is unit-
// testable in isolation and the component file shrinks.
//
// Three modes:
//   - JS / React (treated as JS) → captures console.log
//     into _challengeResults so tests can assert on output.
//   - CSS → renders the challenge's previewHTML (or a small
//     default) styled by the learner's stylesheet.
//   - HTML → renders the learner's markup directly.
// ═══════════════════════════════════════════════

import { IFRAME_STYLES } from '../../../utils/iframeStyles';

const DEFAULT_CSS_PREVIEW_HTML =
  '<h1>Styled Heading</h1><p>Body text</p><div class="card"><h3>Card</h3></div>';

export function buildChallengePreview({ sourceCode, lang, previewHTML }) {
  const isJS = lang === 'js' || lang === 'react';
  const isCSS = lang === 'css';

  if (isJS) {
    // Note the </script> escape: if the learner's code legitimately
    // contains the literal string "</script>" we'd otherwise terminate
    // the wrapping <script> tag prematurely.
    const consoleCapture = `
      const _results = [];
      const _origLog = console.log;
      console.log = (...a) => { _results.push(a.map(String).join(' ')); _origLog(...a); };
      try { ${sourceCode.replace(/<\/script>/g, '<\\/script>')} } catch(e) { console.log('Error: ' + e.message); }
      window._challengeResults = _results;
      window._challengeCode = ${JSON.stringify(sourceCode)};
    `;
    return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body><pre id="out"></pre><script>${consoleCapture}<\/script></body></html>`;
  }

  if (isCSS) {
    const html = previewHTML || DEFAULT_CSS_PREVIEW_HTML;
    return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}\n${sourceCode}</style></head><body>${html}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body>${sourceCode}</body></html>`;
}
