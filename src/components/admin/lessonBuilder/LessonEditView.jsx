// ═══════════════════════════════════════════════
// LESSON EDIT VIEW — Form for module metadata,
// lesson tabs, concepts, code, tasks, and story.
// ═══════════════════════════════════════════════

import { LBField } from '../LBField';

export function LessonEditView({
  moduleInfo,
  lessons,
  activeLessonIdx,
  lesson,
  updateModule,
  updateLesson,
  updateArrayItem,
  addArrayItem,
  removeArrayItem,
  addLesson,
  removeLesson,
  setActiveLessonIdx,
}) {
  return (
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
        <h3 className="lb-section-title">Lesson Details</h3>
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
  );
}
