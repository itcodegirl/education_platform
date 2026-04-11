// ═══════════════════════════════════════════════
// LESSON BUILDER — Create lessons, preview, and
// download as ready-to-use JS module files.
// ═══════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { COURSES } from '../../data';

const EMPTY_LESSON = {
  id: '',
  title: '',
  scaffolding: 'full',
  difficulty: 'beginner',
  duration: '',
  concepts: [''],
  code: '',
  output: '',
  tasks: [''],
  challenge: '',
  devFession: '',
};

const EMPTY_MODULE = {
  id: '',
  emoji: '',
  title: '',
  tagline: '',
  difficulty: 'beginner',
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeJS(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

export function LessonBuilder() {
  const [moduleInfo, setModuleInfo] = useState({ ...EMPTY_MODULE });
  const [lessons, setLessons] = useState([{ ...EMPTY_LESSON }]);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [view, setView] = useState('edit'); // edit | preview | code
  const [copied, setCopied] = useState(false);

  const lesson = lessons[activeLessonIdx];

  // ─── Module field updater ────────────────────
  const updateModule = useCallback((field, value) => {
    setModuleInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ─── Lesson field updater ────────────────────
  const updateLesson = useCallback(
    (field, value) => {
      setLessons((prev) =>
        prev.map((l, i) => (i === activeLessonIdx ? { ...l, [field]: value } : l)),
      );
    },
    [activeLessonIdx],
  );

  // ─── Array field helpers ─────────────────────
  const updateArrayItem = useCallback(
    (field, idx, value) => {
      setLessons((prev) =>
        prev.map((l, i) => {
          if (i !== activeLessonIdx) return l;
          const arr = [...l[field]];
          arr[idx] = value;
          return { ...l, [field]: arr };
        }),
      );
    },
    [activeLessonIdx],
  );

  const addArrayItem = useCallback(
    (field) => {
      setLessons((prev) =>
        prev.map((l, i) =>
          i === activeLessonIdx ? { ...l, [field]: [...l[field], ''] } : l,
        ),
      );
    },
    [activeLessonIdx],
  );

  const removeArrayItem = useCallback(
    (field, idx) => {
      setLessons((prev) =>
        prev.map((l, i) => {
          if (i !== activeLessonIdx) return l;
          const arr = l[field].filter((_, j) => j !== idx);
          return { ...l, [field]: arr.length > 0 ? arr : [''] };
        }),
      );
    },
    [activeLessonIdx],
  );

  // ─── Lesson management ──────────────────────
  const addLesson = () => {
    const newLesson = { ...EMPTY_LESSON };
    setLessons((prev) => [...prev, newLesson]);
    setActiveLessonIdx(lessons.length);
  };

  const removeLesson = (idx) => {
    if (lessons.length <= 1) return;
    setLessons((prev) => prev.filter((_, i) => i !== idx));
    setActiveLessonIdx((prev) => Math.min(prev, lessons.length - 2));
  };

  // ─── Code generation ────────────────────────
  const generateCode = useCallback(() => {
    const lessonsCode = lessons
      .map((l) => {
        const prereqs = l.prereqs
          ? `[${l.prereqs
              .split(',')
              .map((p) => `'${p.trim()}'`)
              .filter((p) => p !== "''")
              .join(', ')}]`
          : '[]';

        const concepts = l.concepts
          .filter(Boolean)
          .map((c) => `      '${escapeJS(c)}',`)
          .join('\n');

        const tasks = l.tasks
          .filter(Boolean)
          .map((t) => `      '${escapeJS(t)}',`)
          .join('\n');

        return `    {
      id: '${escapeJS(l.id)}',${l.scaffolding && l.scaffolding !== 'full' ? ` scaffolding: '${l.scaffolding}',` : ''}
      title: '${escapeJS(l.title)}',
      prereqs: ${prereqs},
      difficulty: '${l.difficulty}',
      duration: '${escapeJS(l.duration)}',
      concepts: [
${concepts}
      ],
      code: \`${l.code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
      output: '${escapeJS(l.output)}',
      tasks: [
${tasks}
      ],
      challenge: '${escapeJS(l.challenge)}',
      devFession: '${escapeJS(l.devFession)}',
    }`;
      })
      .join(',\n');

    return `export const module = {
  id: ${moduleInfo.id || 0},
  emoji: '${moduleInfo.emoji}',
  title: '${escapeJS(moduleInfo.title)}',
  tagline: '${escapeJS(moduleInfo.tagline)}',
  difficulty: '${moduleInfo.difficulty}',
  lessons: [
${lessonsCode},
  ],
};
`;
  }, [lessons, moduleInfo]);

  // ─── Download file ──────────────────────────
  const downloadFile = useCallback(() => {
    const code = generateCode();
    const slug = slugify(moduleInfo.title) || 'new-module';
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.js`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateCode, moduleInfo.title]);

  // ─── Copy to clipboard ─────────────────────
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(generateCode()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generateCode]);

  // ─── Validation ─────────────────────────────
  const issues = [];
  if (!moduleInfo.title) issues.push('Module title is required');
  if (!moduleInfo.id) issues.push('Module ID is required');
  lessons.forEach((l, i) => {
    const prefix = lessons.length > 1 ? `Lesson ${i + 1}: ` : '';
    if (!l.id) issues.push(`${prefix}Lesson ID is required`);
    if (!l.title) issues.push(`${prefix}Lesson title is required`);
    if (!l.concepts.filter(Boolean).length) issues.push(`${prefix}At least one concept is required`);
  });

  return (
    <div className="lb-wrap">
      {/* View Tabs */}
      <div className="lb-view-tabs">
        <button
          type="button"
          className={`lb-view-tab ${view === 'edit' ? 'active' : ''}`}
          onClick={() => setView('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          className={`lb-view-tab ${view === 'preview' ? 'active' : ''}`}
          onClick={() => setView('preview')}
        >
          Preview
        </button>
        <button
          type="button"
          className={`lb-view-tab ${view === 'code' ? 'active' : ''}`}
          onClick={() => setView('code')}
        >
          Code Output
        </button>
      </div>

      {/* ═══ EDIT VIEW ═══ */}
      {view === 'edit' && (
        <div className="lb-edit">
          {/* Module Info */}
          <section className="lb-section">
            <h3 className="lb-section-title">Module Info</h3>
            <div className="lb-field-grid">
              <LBField label="Module ID" hint="e.g. 21 for HTML module 21">
                <input
                  type="number"
                  value={moduleInfo.id}
                  onChange={(e) => updateModule('id', e.target.value)}
                  placeholder="21"
                />
              </LBField>
              <LBField label="Emoji">
                <input
                  value={moduleInfo.emoji}
                  onChange={(e) => updateModule('emoji', e.target.value)}
                  placeholder="e.g. &nbsp;🚀"
                />
              </LBField>
              <LBField label="Title" span2>
                <input
                  value={moduleInfo.title}
                  onChange={(e) => updateModule('title', e.target.value)}
                  placeholder="e.g. Advanced Flexbox"
                />
              </LBField>
              <LBField label="Tagline" span2>
                <input
                  value={moduleInfo.tagline}
                  onChange={(e) => updateModule('tagline', e.target.value)}
                  placeholder="e.g. Master flexible layouts."
                />
              </LBField>
              <LBField label="Difficulty">
                <select
                  value={moduleInfo.difficulty}
                  onChange={(e) => updateModule('difficulty', e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </LBField>
            </div>
          </section>

          {/* Lesson Tabs */}
          <div className="lb-lesson-tabs">
            {lessons.map((l, i) => (
              <button
                key={i}
                type="button"
                className={`lb-lesson-tab ${i === activeLessonIdx ? 'active' : ''}`}
                onClick={() => setActiveLessonIdx(i)}
              >
                {l.title || `Lesson ${i + 1}`}
                {lessons.length > 1 && (
                  <span
                    className="lb-lesson-tab-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLesson(i);
                    }}
                  >
                    x
                  </span>
                )}
              </button>
            ))}
            <button type="button" className="lb-lesson-tab lb-add-btn" onClick={addLesson}>
              + Add Lesson
            </button>
          </div>

          {/* Lesson Fields */}
          <section className="lb-section">
            <h3 className="lb-section-title">
              Lesson Details
            </h3>
            <div className="lb-field-grid">
              <LBField label="Lesson ID" hint="e.g. h21-1">
                <input
                  value={lesson.id}
                  onChange={(e) => updateLesson('id', e.target.value)}
                  placeholder="h21-1"
                />
              </LBField>
              <LBField label="Title" span2>
                <input
                  value={lesson.title}
                  onChange={(e) => updateLesson('title', e.target.value)}
                  placeholder="e.g. Flex Direction & Wrap"
                />
              </LBField>
              <LBField label="Difficulty">
                <select
                  value={lesson.difficulty}
                  onChange={(e) => updateLesson('difficulty', e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </LBField>
              <LBField label="Duration" hint="e.g. 8 min">
                <input
                  value={lesson.duration}
                  onChange={(e) => updateLesson('duration', e.target.value)}
                  placeholder="8 min"
                />
              </LBField>
              <LBField label="Scaffolding Level" hint="How much code is provided">
                <select
                  value={lesson.scaffolding}
                  onChange={(e) => updateLesson('scaffolding', e.target.value)}
                >
                  <option value="full">Full — complete example</option>
                  <option value="partial">Partial — has TODOs</option>
                  <option value="starter">Starter — minimal skeleton</option>
                  <option value="requirements">Requirements — write from scratch</option>
                </select>
              </LBField>
              <LBField label="Prerequisites" hint="Comma-separated IDs">
                <input
                  value={lesson.prereqs || ''}
                  onChange={(e) => updateLesson('prereqs', e.target.value)}
                  placeholder="e.g. h20-3, h20-4"
                />
              </LBField>
            </div>
          </section>

          {/* Concepts */}
          <section className="lb-section">
            <h3 className="lb-section-title">Key Concepts</h3>
            {lesson.concepts.map((c, i) => (
              <div key={i} className="lb-array-row">
                <span className="lb-array-num">{i + 1}</span>
                <input
                  value={c}
                  onChange={(e) => updateArrayItem('concepts', i, e.target.value)}
                  placeholder="Enter a key concept..."
                />
                <button
                  type="button"
                  className="lb-array-rm"
                  onClick={() => removeArrayItem('concepts', i)}
                  title="Remove"
                >
                  -
                </button>
              </div>
            ))}
            <button type="button" className="lb-add-item" onClick={() => addArrayItem('concepts')}>
              + Add Concept
            </button>
          </section>

          {/* Code Example */}
          <section className="lb-section">
            <h3 className="lb-section-title">Code Example</h3>
            <LBField label="Code">
              <textarea
                className="lb-code-input"
                value={lesson.code}
                onChange={(e) => updateLesson('code', e.target.value)}
                placeholder={'<div class="container">\n  <h1>Hello</h1>\n</div>'}
                rows={8}
              />
            </LBField>
            <LBField label="Expected Output">
              <textarea
                value={lesson.output}
                onChange={(e) => updateLesson('output', e.target.value)}
                placeholder="Describe what the code produces..."
                rows={3}
              />
            </LBField>
          </section>

          {/* Tasks */}
          <section className="lb-section">
            <h3 className="lb-section-title">Practice Tasks</h3>
            {lesson.tasks.map((t, i) => (
              <div key={i} className="lb-array-row">
                <span className="lb-array-num">{i + 1}</span>
                <input
                  value={t}
                  onChange={(e) => updateArrayItem('tasks', i, e.target.value)}
                  placeholder="Enter a practice task..."
                />
                <button
                  type="button"
                  className="lb-array-rm"
                  onClick={() => removeArrayItem('tasks', i)}
                  title="Remove"
                >
                  -
                </button>
              </div>
            ))}
            <button type="button" className="lb-add-item" onClick={() => addArrayItem('tasks')}>
              + Add Task
            </button>
          </section>

          {/* Challenge & DevFession */}
          <section className="lb-section">
            <h3 className="lb-section-title">Challenge & Story</h3>
            <LBField label="Challenge">
              <textarea
                value={lesson.challenge}
                onChange={(e) => updateLesson('challenge', e.target.value)}
                placeholder="Give students a hands-on challenge..."
                rows={3}
              />
            </LBField>
            <LBField label="Dev Confession" hint="Fun personal anecdote">
              <textarea
                value={lesson.devFession}
                onChange={(e) => updateLesson('devFession', e.target.value)}
                placeholder="A relatable story or fun fact..."
                rows={3}
              />
            </LBField>
          </section>
        </div>
      )}

      {/* ═══ PREVIEW VIEW ═══ */}
      {view === 'preview' && (
        <div className="lb-preview">
          <div className="lb-preview-card">
            <div className="lb-pv-head">
              <span className="lb-pv-emoji">{moduleInfo.emoji || '📄'}</span>
              <div className="lb-pv-head-text">
                <div className="lb-pv-module">{moduleInfo.title || 'Untitled Module'}</div>
                <h2 className="lb-pv-title">{lesson.title || 'Untitled Lesson'}</h2>
                <div className="lb-pv-meta">
                  <span className={`lb-pv-diff lb-pv-diff-${lesson.difficulty}`}>
                    {lesson.difficulty}
                  </span>
                  {lesson.duration && <span className="lb-pv-dur">{lesson.duration}</span>}
                </div>
              </div>
            </div>

            {lesson.concepts.filter(Boolean).length > 0 && (
              <div className="lb-pv-concepts">
                {lesson.concepts.filter(Boolean).map((c, i) => (
                  <div key={i} className="lb-pv-concept">
                    <span className="lb-pv-bullet">{'>'}</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            )}

            {lesson.code && (
              <div className="lb-pv-code-block">
                <div className="lb-pv-code-header">Code</div>
                <pre className="lb-pv-code">{lesson.code}</pre>
              </div>
            )}

            {lesson.output && (
              <div className="lb-pv-box lb-pv-output">
                <div className="lb-pv-box-label">Output</div>
                <p>{lesson.output}</p>
              </div>
            )}

            {lesson.tasks.filter(Boolean).length > 0 && (
              <div className="lb-pv-box lb-pv-tasks">
                <div className="lb-pv-box-label">Tasks</div>
                {lesson.tasks.filter(Boolean).map((t, i) => (
                  <div key={i} className="lb-pv-task">
                    <span className="lb-pv-task-check">○</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {lesson.challenge && (
              <div className="lb-pv-box lb-pv-challenge">
                <div className="lb-pv-box-label">Challenge</div>
                <p>{lesson.challenge}</p>
              </div>
            )}

            {lesson.devFession && (
              <div className="lb-pv-devfession">
                <span className="lb-pv-devfession-icon">💬</span>
                <p>{lesson.devFession}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CODE VIEW ═══ */}
      {view === 'code' && (
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

          <pre className="lb-code-output">{generateCode()}</pre>

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
                <code>src/data/[course]/modules/{slugify(moduleInfo.title) || 'module-name'}.js</code>
              </li>
              <li>
                Open <code>src/data/[course]/course.js</code> and add:
                <pre className="lb-instructions-code">
{`import { module as mod${moduleInfo.id || 'XX'} } from './modules/${slugify(moduleInfo.title) || 'module-name'}';

// Add to the modules array:
export const MODULES = [..., mod${moduleInfo.id || 'XX'}];`}
                </pre>
              </li>
              <li>Commit, push, and deploy.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Field Component ──────────────────
function LBField({ label, hint, span2, children }) {
  return (
    <div className={`lb-field ${span2 ? 'lb-field-span2' : ''}`}>
      <label className="lb-label">
        {label}
        {hint && <span className="lb-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
