// CodeOutputView — surfaces the generated module code, validation
// issues, copy-to-clipboard + download actions, and the manual
// integration instructions. Pure presentation; the parent does the
// codegen + side effects.

import { useCallback, useState } from 'react';
import { generateModuleCode, slugify } from './lessonCodegen';

export function CodeOutputView({ moduleInfo, lessons, issues }) {
  const code = generateModuleCode({ moduleInfo, lessons });
  const moduleSlug = slugify(moduleInfo.title) || 'module-name';
  const [copied, setCopied] = useState(false);

  const downloadFile = useCallback(() => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleSlug}.js`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, moduleSlug]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="lb-code-view">
      {issues.length > 0 && (
        <div className="lb-issues">
          <strong>Missing fields:</strong>
          <ul>
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <pre className="lb-code-output">{code}</pre>

      <div className="lb-code-actions">
        <button type="button" className="lb-btn lb-btn-primary" onClick={downloadFile}>
          Download .js File
        </button>
        <button type="button" className="lb-btn lb-btn-secondary" onClick={copyCode}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      <div className="lb-instructions">
        <h4>How to add this to your platform:</h4>
        <ol>
          <li>
            Save the file to{' '}
            <code>src/data/[course]/modules/{moduleSlug}.js</code>
          </li>
          <li>
            Open <code>src/data/[course]/course.js</code> and add:
            <pre className="lb-instructions-code">
{`import { module as mod${moduleInfo.id || 'XX'} } from './modules/${moduleSlug}';

// Add to the modules array:
export const MODULES = [..., mod${moduleInfo.id || 'XX'}];`}
            </pre>
          </li>
          <li>Commit, push, and deploy.</li>
        </ol>
      </div>
    </div>
  );
}
