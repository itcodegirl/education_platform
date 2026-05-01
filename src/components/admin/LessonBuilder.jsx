// ═══════════════════════════════════════════════
// LessonBuilder — orchestrator for the admin lesson
// authoring tool. Owns only the view-tab state; the
// form state + validation lives in useLessonBuilder,
// the codegen + emission lives in lessonCodegen, and
// each view tab is its own file under lesson-builder/.
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { useLessonBuilder } from '../../hooks/useLessonBuilder';
import { EditView } from './lesson-builder/EditView';
import { PreviewView } from './lesson-builder/PreviewView';
import { CodeOutputView } from './lesson-builder/CodeOutputView';

const VIEW_TABS = [
  { id: 'edit', label: 'Edit' },
  { id: 'preview', label: 'Preview' },
  { id: 'code', label: 'Code Output' },
];

export function LessonBuilder() {
  const [view, setView] = useState('edit');
  const builder = useLessonBuilder();

  return (
    <div className="lb-wrap">
      <div className="lb-view-tabs">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`lb-view-tab ${view === tab.id ? 'active' : ''}`}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'edit' && (
        <EditView
          moduleInfo={builder.moduleInfo}
          lessons={builder.lessons}
          activeLessonIdx={builder.activeLessonIdx}
          activeLesson={builder.activeLesson}
          onSetActiveLessonIdx={builder.setActiveLessonIdx}
          onUpdateModule={builder.updateModule}
          onUpdateLesson={builder.updateLesson}
          onUpdateArrayItem={builder.updateArrayItem}
          onAddArrayItem={builder.addArrayItem}
          onRemoveArrayItem={builder.removeArrayItem}
          onAddLesson={builder.addLesson}
          onRemoveLesson={builder.removeLesson}
        />
      )}

      {view === 'preview' && (
        <PreviewView moduleInfo={builder.moduleInfo} lesson={builder.activeLesson} />
      )}

      {view === 'code' && (
        <CodeOutputView
          moduleInfo={builder.moduleInfo}
          lessons={builder.lessons}
          issues={builder.issues}
        />
      )}
    </div>
  );
}
