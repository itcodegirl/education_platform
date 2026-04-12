// ═══════════════════════════════════════════════
// LESSON BUILDER — Draft lessons, preview them, and
// export ready-to-drop-in module files.
//
// This file owns state and view routing. The three
// views live under ./lessonBuilder/ and the codegen
// helpers live in ./lessonBuilderCodegen.js.
// ═══════════════════════════════════════════════

import { useState, useCallback } from 'react';
import {
  slugify,
  generateModuleCode,
  validateDraft,
} from './lessonBuilderCodegen';
import { LessonEditView } from './lessonBuilder/LessonEditView';
import { LessonPreviewView } from './lessonBuilder/LessonPreviewView';
import { LessonCodeView } from './lessonBuilder/LessonCodeView';
import { logAdminAction, AUDIT_ACTIONS } from '../../services/auditLogService';

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

export function LessonBuilder({ currentAdminId, currentAdminName } = {}) {
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
  const generateCode = useCallback(
    () => generateModuleCode(moduleInfo, lessons),
    [lessons, moduleInfo],
  );

  // Shared audit-log details snapshot captured at the time of export.
  // Kept as a function so the values reflect the latest draft state
  // rather than whatever moduleInfo/lessons were on the first render.
  const buildAuditDetails = useCallback(
    () => ({
      module_id: moduleInfo.id || null,
      module_title: moduleInfo.title || null,
      lesson_count: lessons.length,
      lesson_titles: lessons.map((l) => l.title).filter(Boolean),
    }),
    [moduleInfo, lessons],
  );

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

    if (currentAdminId) {
      logAdminAction({
        adminId: currentAdminId,
        adminName: currentAdminName,
        action: AUDIT_ACTIONS.LESSON_DOWNLOADED,
        details: buildAuditDetails(),
      });
    }
  }, [generateCode, moduleInfo.title, currentAdminId, currentAdminName, buildAuditDetails]);

  // ─── Copy to clipboard ─────────────────────
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(generateCode()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (currentAdminId) {
        logAdminAction({
          adminId: currentAdminId,
          adminName: currentAdminName,
          action: AUDIT_ACTIONS.LESSON_COPIED,
          details: buildAuditDetails(),
        });
      }
    });
  }, [generateCode, currentAdminId, currentAdminName, buildAuditDetails]);

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

      {view === 'edit' && (
        <LessonEditView
          moduleInfo={moduleInfo}
          lessons={lessons}
          activeLessonIdx={activeLessonIdx}
          lesson={lesson}
          updateModule={updateModule}
          updateLesson={updateLesson}
          updateArrayItem={updateArrayItem}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
          addLesson={addLesson}
          removeLesson={removeLesson}
          setActiveLessonIdx={setActiveLessonIdx}
        />
      )}

      {view === 'preview' && (
        <LessonPreviewView moduleInfo={moduleInfo} lesson={lesson} />
      )}

      {view === 'code' && (
        <LessonCodeView
          moduleInfo={moduleInfo}
          code={generateCode()}
          issues={validateDraft(moduleInfo, lessons)}
          copied={copied}
          onDownload={downloadFile}
          onCopy={copyCode}
        />
      )}
    </div>
  );
}
