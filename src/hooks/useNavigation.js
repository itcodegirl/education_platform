// ===============================================================
// useNavigation - Course/module/lesson navigation
// Extracted from App.jsx for clarity
// ===============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { COURSES, QUIZ_MAP } from '../data';
import { useCourseContent } from '../providers';
import { navigateTo, toPathFromLegacyHash } from '../routes/routeUtils';
import { buildLearnPath, parseLearnPath } from '../routes/routePaths';
import { getLessonKeyVariants } from '../utils/lessonKeys';

// Safe empty shells used when a course's modules haven't loaded yet.
// AppLayout gates the real UI behind isActiveCourseLoaded, so these
// defaults should never actually render. They exist so that
// useNavigation can run to completion without crashing on the first
// frame, before the active course has been fetched.
const EMPTY_LESSON = { id: '', title: '', content: '', code: '' };
const EMPTY_MODULE = { id: '', title: '', emoji: '', lessons: [EMPTY_LESSON] };
const EMPTY_COURSE = { id: '', label: '', icon: '', accent: '', modules: [EMPTY_MODULE] };

function getScopedQuiz(type, courseId, entityId) {
  if (!courseId || !entityId) return undefined;
  return QUIZ_MAP.get(`${type}:${courseId}:${entityId}`);
}

function findPathPosition(pathname) {
  const parsed = parseLearnPath(pathname);
  if (!parsed) return null;

  const courseIndex = COURSES.findIndex((course) => course.id === parsed.courseId);
  if (courseIndex === -1) return null;

  const course = COURSES[courseIndex];
  if (!course.modules.length) return null;

  const moduleIndex = course.modules.findIndex((module) => module.id === parsed.moduleId);
  if (moduleIndex === -1) return null;

  const moduleData = course.modules[moduleIndex];
  if (!moduleData.lessons.length) return null;

  if (parsed.lessonId === 'quiz') {
    const hasModuleQuiz = Boolean(getScopedQuiz('m', course.id, moduleData.id));
    if (!hasModuleQuiz) return null;

    return {
      courseIndex,
      moduleIndex,
      lessonIndex: moduleData.lessons.length - 1,
      isModuleQuiz: true,
    };
  }

  const lessonIndex = moduleData.lessons.findIndex((lesson) => lesson.id === parsed.lessonId);
  if (lessonIndex === -1) return null;

  return { courseIndex, moduleIndex, lessonIndex, isModuleQuiz: false };
}

function findSavedPosition(lastPosition) {
  if (!lastPosition?.course || !lastPosition?.mod || !lastPosition?.les) {
    return null;
  }

  const courseIndex = COURSES.findIndex((course) => lastPosition.course.includes(course.label));
  if (courseIndex === -1) return null;

  const course = COURSES[courseIndex];
  if (!course.modules.length) return null;
  const moduleIndex = course.modules.findIndex((module) => lastPosition.mod.includes(module.title));
  if (moduleIndex === -1) return null;

  const isModuleQuiz = lastPosition.les.toLowerCase().includes('module quiz');
  const lessonIndex = isModuleQuiz
    ? course.modules[moduleIndex].lessons.length - 1
    : course.modules[moduleIndex].lessons.findIndex((lesson) => lesson.title === lastPosition.les);

  if (lessonIndex === -1) return null;

  return { courseIndex, moduleIndex, lessonIndex, isModuleQuiz };
}

function getInitialNavigationState() {
  if (typeof window === 'undefined') {
    return {
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 0,
      isModuleQuiz: false,
    };
  }

  const legacyPath = toPathFromLegacyHash(window.location.hash || '');
  const pathname = legacyPath || window.location.pathname;
  const parsedPath = parseLearnPath(pathname);
  if (!parsedPath) {
    return {
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 0,
      isModuleQuiz: false,
    };
  }

  const routeCourseIdx = COURSES.findIndex((entry) => entry.id === parsedPath.courseId);
  if (routeCourseIdx === -1) {
    return {
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 0,
      isModuleQuiz: false,
    };
  }

  const resolved = findPathPosition(pathname);
  if (resolved) {
    return {
      courseIndex: resolved.courseIndex,
      moduleIndex: resolved.moduleIndex,
      lessonIndex: resolved.lessonIndex,
      isModuleQuiz: resolved.isModuleQuiz,
    };
  }

  const fallbackCourse = COURSES[routeCourseIdx];
  const fallbackModule = fallbackCourse?.modules?.[0];
  const hasFallbackLesson = Boolean(fallbackModule?.lessons?.length);
  if (!hasFallbackLesson) {
    return {
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 0,
      isModuleQuiz: false,
    };
  }

  return {
    courseIndex: routeCourseIdx,
    moduleIndex: 0,
    lessonIndex: 0,
    isModuleQuiz: false,
  };
}

export function useNavigation() {
  const { ensureLoaded } = useCourseContent();
  const initialNavState = getInitialNavigationState();
  const [courseIdx, setCourseIdx] = useState(initialNavState.courseIndex);
  const [modIdx, setModIdx] = useState(initialNavState.moduleIndex);
  const [lesIdx, setLesIdx] = useState(initialNavState.lessonIndex);
  const [showModQuiz, setShowModQuiz] = useState(initialNavState.isModuleQuiz);
  const mainRef = useRef(null);
  const didWriteInitialPath = useRef(false);
  const syncingFromPathRef = useRef(false);
  const pathSyncTokenRef = useRef(0);

  // Defensive reads - COURSES is mutable and may temporarily have
  // empty modules while CourseContentProvider is fetching the active
  // course. AppLayout's loading gate prevents these fallbacks from
  // rendering, but they let this hook compute safely.
  const course = COURSES[courseIdx] || EMPTY_COURSE;
  const modules = course.modules?.length ? course.modules : EMPTY_COURSE.modules;
  const mod = modules[modIdx] || EMPTY_MODULE;
  const les = (mod.lessons && mod.lessons[lesIdx]) || EMPTY_LESSON;
  const isLastLesson = lesIdx === (mod.lessons?.length || 1) - 1;
  const lessonQuiz = getScopedQuiz('l', course.id, les.id);
  const moduleQuiz = getScopedQuiz('m', course.id, mod.id);
  const { stable: stableLessonKey, legacy: legacyLessonKey } = getLessonKeyVariants(course, mod, les);
  const lessonKey = stableLessonKey || legacyLessonKey;

  const courseTotal = modules.reduce((sum, moduleData) => sum + (moduleData.lessons?.length || 0), 0);
  const isFirst = modIdx === 0 && lesIdx === 0 && !showModQuiz;
  const isLast = modIdx === modules.length - 1
    && lesIdx === (mod.lessons?.length || 1) - 1
    && (showModQuiz || !moduleQuiz);

  const scrollTop = () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    mainRef.current?.scrollTo({ top: 0, behavior });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let isUnmounted = false;

    const syncFromPath = async () => {
      const legacyPath = toPathFromLegacyHash(window.location.hash || '');
      if (legacyPath) {
        window.history.replaceState(null, '', `${legacyPath}${window.location.search}`);
      }

      const parsedPath = parseLearnPath(window.location.pathname);
      if (!parsedPath) return;

      const routeCourseIdx = COURSES.findIndex((entry) => entry.id === parsedPath.courseId);
      if (routeCourseIdx === -1) return;

      const token = ++pathSyncTokenRef.current;
      syncingFromPathRef.current = true;

      try {
        if (!COURSES[routeCourseIdx]?.modules?.length) {
          await ensureLoaded(parsedPath.courseId);
        }

        if (isUnmounted || token !== pathSyncTokenRef.current) return;

        const resolved = findPathPosition(window.location.pathname);
        if (resolved) {
          setCourseIdx(resolved.courseIndex);
          setModIdx(resolved.moduleIndex);
          setLesIdx(resolved.lessonIndex);
          setShowModQuiz(resolved.isModuleQuiz);
          return;
        }

        const fallbackCourse = COURSES[routeCourseIdx];
        const fallbackModule = fallbackCourse?.modules?.[0];
        const hasFallbackLesson = Boolean(fallbackModule?.lessons?.length);
        if (!hasFallbackLesson) return;

        setCourseIdx(routeCourseIdx);
        setModIdx(0);
        setLesIdx(0);
        setShowModQuiz(false);
      } finally {
        if (!isUnmounted && token === pathSyncTokenRef.current) {
          syncingFromPathRef.current = false;
        }
      }
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    window.addEventListener('hashchange', syncFromPath);
    return () => {
      isUnmounted = true;
      pathSyncTokenRef.current += 1;
      window.removeEventListener('popstate', syncFromPath);
      window.removeEventListener('hashchange', syncFromPath);
    };
  }, [ensureLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (syncingFromPathRef.current) return;

    const nextPath = buildLearnPath(course, mod, les, showModQuiz);
    if (!nextPath) return;

    if (window.location.pathname === nextPath) {
      didWriteInitialPath.current = true;
      return;
    }

    if (!didWriteInitialPath.current) {
      navigateTo(nextPath, { replace: true });
      didWriteInitialPath.current = true;
      return;
    }

    navigateTo(nextPath);
  }, [course, mod, les, showModQuiz]);

  const go = useCallback((mi, li) => {
    setModIdx(mi);
    setLesIdx(li);
    setShowModQuiz(false);
    scrollTop();
  }, []);

  const switchCourse = useCallback((ci) => {
    if (ci < 0 || ci >= COURSES.length) return;
    setCourseIdx(ci);
    setModIdx(0);
    setLesIdx(0);
    setShowModQuiz(false);
    scrollTop();
  }, []);

  const next = useCallback(() => {
    if (showModQuiz) {
      setShowModQuiz(false);
      if (modIdx < modules.length - 1) go(modIdx + 1, 0);
      return;
    }
    if (isLastLesson && moduleQuiz && !showModQuiz) {
      setShowModQuiz(true);
      scrollTop();
      return;
    }
    if (lesIdx < mod.lessons.length - 1) go(modIdx, lesIdx + 1);
    else if (modIdx < modules.length - 1) go(modIdx + 1, 0);
  }, [modIdx, lesIdx, showModQuiz, isLastLesson, moduleQuiz, mod.lessons.length, modules.length, go]);

  const prev = useCallback(() => {
    if (showModQuiz) {
      setShowModQuiz(false);
      scrollTop();
      return;
    }
    if (lesIdx > 0) go(modIdx, lesIdx - 1);
    else if (modIdx > 0) go(modIdx - 1, modules[modIdx - 1].lessons.length - 1);
  }, [modIdx, lesIdx, showModQuiz, modules, go]);

  const goToSearch = useCallback((ci, mi, li) => {
    setCourseIdx(ci);
    setModIdx(mi);
    setLesIdx(li);
    setShowModQuiz(false);
    scrollTop();
  }, []);

  const goToModQuiz = useCallback((mi) => {
    setModIdx(mi);
    setLesIdx(modules[mi].lessons.length - 1);
    setShowModQuiz(true);
    scrollTop();
  }, [modules]);

  const resumeFromPosition = useCallback((lastPosition) => {
    const saved = findSavedPosition(lastPosition);
    if (!saved) return false;

    setCourseIdx(saved.courseIndex);
    setModIdx(saved.moduleIndex);
    setLesIdx(saved.lessonIndex);
    setShowModQuiz(saved.isModuleQuiz);
    scrollTop();
    return true;
  }, []);

  return {
    courseIdx, modIdx, lesIdx, showModQuiz,
    course, modules, mod, les,
    lessonKey, lessonQuiz, moduleQuiz,
    courseTotal, isFirst, isLast, isLastLesson,
    mainRef,
    go, next, prev, switchCourse, goToSearch, goToModQuiz, resumeFromPosition,
    setShowModQuiz,
  };
}
