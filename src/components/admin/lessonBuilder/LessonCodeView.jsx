// ═══════════════════════════════════════════════
// LESSON CODE VIEW — Shows the generated module
// source, validation issues, download/copy actions,
// and integration instructions.
// ═══════════════════════════════════════════════

import { slugify } from '../lessonBuilderCodegen';

export function LessonCodeView({
  moduleInfo,
  code,
  issues,
  copied,
  onDownload,
  onCopy,
}) {
  const slug = slugify(moduleInfo.title) || 'module-name';

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
        <button type="button" className="lb-btn lb-btn-primary" onClick={onDownload}>
          Download .js File
        </button>
        <button type="button" className="lb-btn lb-btn-secondary" onClick={onCopy}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      <div className="lb-instructions">
        <h4>How to add this to your platform:</h4>
        <ol>
          <li>
            Save the file to{' '}
            <code>src/data/[course]/modules/{slug}.js</code>
          </li>
          <li>
            Open <code>src/data/[course]/course.js</code> and add:
            <pre className="lb-instructions-code">
{`import { module as mod${moduleInfo.id || 'XX'} } from './modules/${slug}';

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
