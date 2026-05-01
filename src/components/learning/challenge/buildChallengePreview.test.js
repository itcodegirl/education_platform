import { describe, it, expect } from 'vitest';
import { buildChallengePreview } from './buildChallengePreview';

describe('buildChallengePreview', () => {
  it('wraps raw HTML so it renders directly in the iframe body', () => {
    const html = '<h1>Hello</h1>';
    const out = buildChallengePreview({ sourceCode: html, lang: 'html' });

    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('<h1>Hello</h1>');
    expect(out).not.toContain('window._challengeResults');
  });

  it('injects CSS via a <style> tag and uses the challenge previewHTML when given', () => {
    const css = '.box { color: red }';
    const previewHTML = '<div class="box">styled</div>';
    const out = buildChallengePreview({ sourceCode: css, lang: 'css', previewHTML });

    expect(out).toContain('<style>');
    expect(out).toContain('.box { color: red }');
    expect(out).toContain('<div class="box">styled</div>');
  });

  it('falls back to a default CSS preview when previewHTML is missing', () => {
    const out = buildChallengePreview({ sourceCode: '.x{}', lang: 'css' });
    expect(out).toContain('Styled Heading');
    expect(out).toContain('class="card"');
  });

  it('treats both js and react langs as JavaScript and captures console.log output', () => {
    const code = 'console.log("hi")';

    const jsOut = buildChallengePreview({ sourceCode: code, lang: 'js' });
    const reactOut = buildChallengePreview({ sourceCode: code, lang: 'react' });

    expect(jsOut).toContain('window._challengeResults');
    expect(jsOut).toContain('console.log("hi")');
    expect(reactOut).toContain('window._challengeResults');
    expect(reactOut).toContain('console.log("hi")');
  });

  it('escapes literal "</script>" in JS source so it does not terminate the wrapping script tag', () => {
    const code = 'const s = "</script>";';
    const out = buildChallengePreview({ sourceCode: code, lang: 'js' });

    // The dangerous sequence must not appear unescaped before the
    // wrapping script tag's intended close — anywhere inside the
    // captured script body it should be escaped.
    const scriptOpenIdx = out.indexOf('<script>');
    const scriptCloseIdx = out.indexOf('<\/script>');
    expect(scriptOpenIdx).toBeGreaterThan(-1);
    expect(scriptCloseIdx).toBeGreaterThan(scriptOpenIdx);
    const between = out.slice(scriptOpenIdx, scriptCloseIdx);
    // The escaped form is what must survive between the open/close tags.
    expect(between).toContain('<\\/script>');
    // The literal would be the bug we're guarding against.
    expect(between).not.toContain('</script>');
  });
});
