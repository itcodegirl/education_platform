// ═══════════════════════════════════════════════
// LESSON VIEW — Orchestrator for one lesson
//
// Composes four focused child components:
//   - LessonHeader         — emoji, title, metadata, bookmark/notes toggles
//   - LessonNotesPanel     — debounced textarea (lazy-mounted)
//   - StructuredLessonBody — hook/do/understand/build/challenge/summary/bridge
//   - RichLessonBody       — legacy markdown + concepts + tasks + devFession
//
// Owns only the task-checklist state (shared between the two body
// formats) and the Dev_Fession open/closed state. Everything else
// lives in the corresponding child component or in ProgressContext.
//
// Split out from a single 438-line component per the portfolio
// audit, which flagged it as one of three god-components.
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback, memo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToggleBookmark } from '../../hooks/useToggleBookmark';
import { AITutor } from './AITutor';
import { LessonFeedback } from './LessonFeedback';
import { LessonHeader } from './LessonHeader';
import { LessonNotesPanel } from './LessonNotesPanel';
import { StructuredLessonBody } from './StructuredLessonBody';
import { RichLessonBody } from './RichLessonBody';

export const LessonView = memo(function LessonView({
  lesson,
  emoji,
  lang,
  lessonKey,
  courseId,
  moduleTitle,
}) {
  const { bookmarked, handleToggleBookmark } = useToggleBookmark({
    lessonKey,
    courseId,
    lessonTitle: lesson.title,
  });
  const [showNotes, setShowNotes] = useState(false);
  const [showDevFession, setShowDevFession] = useState(false);

  // Per-lesson task state persisted under one localStorage key. We
  // re-seed the in-memory Set whenever lessonKey changes so that
  // the task checklist reflects the new lesson's saved state.
  const [allTasks, setAllTasks] = useLocalStorage('chw-tasks', {});
  const [checkedTasks, setCheckedTasks] = useState(
    () => new Set(allTasks?.[lessonKey] || []),
  );

  const isStructured = !!(lesson.hook || lesson.do || lesson.understand);

  // Derived counts surfaced in the header metadata chips.
  const conceptCount = isStructured
    ? (lesson.understand?.concepts?.length || 0)
    : (lesson.concepts?.length || 0);
  const taskCount = isStructured
    ? (lesson.challenge?.requirements?.length || 0)
    : (lesson.tasks?.length || 0);
  const difficulty = lesson.difficulty || lesson.metadata?.difficulty;
  const duration =
    lesson.duration ||
    (lesson.metadata?.estimatedTime ? `${lesson.metadata.estimatedTime} min` : '');

  // CodePreview source + scaffolding level — pick from whichever
  // shape the lesson is using.
  const codeForPreview = lesson.code || lesson.do?.code || '';
  const scaffolding =
    lesson.scaffolding || (lesson.challenge?.starterCode ? 'starter' : undefined);

  // Reset transient UI state when the active lesson changes.
  useEffect(() => {
    setShowNotes(false);
    setCheckedTasks(new Set(allTasks?.[lessonKey] || []));
    setShowDevFession(false);
    // allTasks is intentionally NOT in the dep list — we only reseed
    // when the active lesson changes. Re-running on every allTasks
    // update would wipe the user's in-progress checks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonKey]);

  // useCallback so the memoized body components don't see a new
  // onToggleTask identity on every parent re-render. setCheckedTasks
  // is stable; lessonKey is the only piece of changing state we
  // capture in the inner setAllTasks closure.
  const toggleTask = useCallback((index) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      setAllTasks((all) => ({ ...(all || {}), [lessonKey]: [...next] }));
      return next;
    });
  }, [lessonKey, setAllTasks]);

  // Stable callback identity so the memoized RichLessonBody can
  // skip re-renders when other lesson-chain state changes.
  const toggleDevFession = useCallback(() => setShowDevFession((value) => !value), []);
  const toggleNotes = useCallback(() => setShowNotes((value) => !value), []);

  return (
    <div className="lesson-surface">
      <LessonHeader
        lesson={lesson}
        emoji={emoji}
        moduleTitle={moduleTitle}
        difficulty={difficulty}
        duration={duration}
        conceptCount={conceptCount}
        taskCount={taskCount}
        scaffolding={scaffolding}
        bookmarked={bookmarked}
        showNotes={showNotes}
        onToggleBookmark={handleToggleBookmark}
        onToggleNotes={toggleNotes}
      />

      {showNotes && <LessonNotesPanel lessonKey={lessonKey} />}

      {isStructured ? (
        <StructuredLessonBody
          lesson={lesson}
          lang={lang}
          scaffolding={scaffolding}
          codeForPreview={codeForPreview}
          checkedTasks={checkedTasks}
          onToggleTask={toggleTask}
        />
      ) : (
        <RichLessonBody
          lesson={lesson}
          lang={lang}
          scaffolding={scaffolding}
          codeForPreview={codeForPreview}
          checkedTasks={checkedTasks}
          onToggleTask={toggleTask}
          showDevFession={showDevFession}
          onToggleDevFession={toggleDevFession}
        />
      )}

      <LessonFeedback lessonKey={lessonKey} />
      <AITutor lesson={lesson} moduleTitle={moduleTitle} courseId={courseId} />
    </div>
  );
});
