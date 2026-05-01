// ═══════════════════════════════════════════════
// useLessonBuilder — owns the entire form state of
// the admin LessonBuilder: module info, an array of
// lessons (each with concepts/tasks sub-arrays), the
// active-lesson tab index, and the current view tab.
//
// Returns memoized updaters so the views stay
// presentational. Validation is computed each render
// (cheap) and exposed as `issues`.
// ═══════════════════════════════════════════════

import { useCallback, useState } from 'react';

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

export function useLessonBuilder() {
  const [moduleInfo, setModuleInfo] = useState(() => ({ ...EMPTY_MODULE }));
  const [lessons, setLessons] = useState(() => [{ ...EMPTY_LESSON }]);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  const updateModule = useCallback((field, value) => {
    setModuleInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateLesson = useCallback(
    (field, value) => {
      setLessons((prev) =>
        prev.map((l, i) => (i === activeLessonIdx ? { ...l, [field]: value } : l)),
      );
    },
    [activeLessonIdx],
  );

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
          // Keep one empty slot so the form never collapses to nothing.
          return { ...l, [field]: arr.length > 0 ? arr : [''] };
        }),
      );
    },
    [activeLessonIdx],
  );

  const addLesson = useCallback(() => {
    setLessons((prev) => {
      setActiveLessonIdx(prev.length);
      return [...prev, { ...EMPTY_LESSON }];
    });
  }, []);

  const removeLesson = useCallback((idx) => {
    setLessons((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setActiveLessonIdx((current) => Math.min(current, next.length - 1));
      return next;
    });
  }, []);

  // Cheap to recompute on every render — saves wiring a useMemo.
  const issues = [];
  if (!moduleInfo.title) issues.push('Module title is required');
  if (!moduleInfo.id) issues.push('Module ID is required');
  lessons.forEach((l, i) => {
    const prefix = lessons.length > 1 ? `Lesson ${i + 1}: ` : '';
    if (!l.id) issues.push(`${prefix}Lesson ID is required`);
    if (!l.title) issues.push(`${prefix}Lesson title is required`);
    if (!l.concepts.filter(Boolean).length) {
      issues.push(`${prefix}At least one concept is required`);
    }
  });

  return {
    moduleInfo,
    lessons,
    activeLessonIdx,
    activeLesson: lessons[activeLessonIdx],
    setActiveLessonIdx,
    updateModule,
    updateLesson,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    addLesson,
    removeLesson,
    issues,
  };
}
