import { describe, it, expect } from 'vitest';
import { buildCodePreviewConsoleScript } from './codePreviewConsoleScript';

describe('buildCodePreviewConsoleScript', () => {
  it('returns a string', () => {
    expect(typeof buildCodePreviewConsoleScript('console.log(1)')).toBe('string');
  });

  it('embeds the source code in output', () => {
    const out = buildCodePreviewConsoleScript('const x = 42;');
    expect(out).toContain('const x = 42;');
  });

  it('escapes </script> tags in source', () => {
    const out = buildCodePreviewConsoleScript('document.write("</script>");');
    expect(out).not.toContain('</script>');
    expect(out).toContain('<\\/script>');
  });

  it('replaces all </script> occurrences', () => {
    const out = buildCodePreviewConsoleScript('</script></script>');
    expect(out).not.toContain('</script>');
    expect(out.split('<\\/script>').length).toBe(3);
  });

  it('wraps source code in try/catch', () => {
    const out = buildCodePreviewConsoleScript('throw new Error("boom")');
    expect(out).toMatch(/try\s*\{/);
    expect(out).toMatch(/\}\s*catch\s*\(/);
  });

  it('contains outputElement setup and appendConsoleLine helper', () => {
    const out = buildCodePreviewConsoleScript('');
    expect(out).toContain("document.getElementById('out')");
    expect(out).toContain('appendConsoleLine');
  });

  it('contains console override with log, error, warn', () => {
    const out = buildCodePreviewConsoleScript('');
    expect(out).toContain('log:');
    expect(out).toContain('error:');
    expect(out).toContain('warn:');
  });

  it('handles empty source without throwing', () => {
    const out = buildCodePreviewConsoleScript('');
    expect(out).toBeTruthy();
  });
});
