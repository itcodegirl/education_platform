// ═══════════════════════════════════════════════
// useNavigation — Course/module/lesson navigation
// Extracted from App.jsx for clarity
// ═══════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { COURSES, QUIZ_MAP } from '../data';

function findSavedPosition(lastPosition) {
  if (!lastPosition?.course || !lastPosition?.mod || !lastPosition?.les) {
    return null;
  }

  const courseIndex = COURSES.findIndex((course) => lastPosition.course.includes(course.label));
  if (courseIndex === -1) return null;

  const course = COURSES[courseIndex];
  const moduleIndex = course.modules.findIndex((module) => lastPosition.mod.includes(module.title));
  if (moduleIndex === -1) return null;

  const isModuleQuiz = lastPosition.les.toLowerCase().includes('module quiz');
  const lessonIndex = isModuleQuiz
    ? course.modules[moduleIndex].lessons.length - 1
    : course.modules[moduleIndex].lessons.findIndex((lesson) => lesson.title === lastPosition.les);

  if (lessonIndex === -1) return null;

  return { courseIndex, moduleIndex, lessonIndex, isModuleQuiz };
}

export function useNavigation() {
  const [courseIdx, setCourseIdx] = useState(0);
  const [modIdx, setModIdx] = useState(0);
  const [lesIdx, setLesIdx] = useState(0);
  const [showModQuiz, setShowModQuiz] = useState(false);
  const mainRef = useRef(null);

  const course = COURSES[courseIdx];
  const modules = course.modules;
  const mod = modules[modIdx];
  const les = mod.lessons[lesIdx];
  const isLastLesson = lesIdx === mod.lessons.length - 1;
  const lessonQuiz = QUIZ_MAP.get(`l:${les.id}`);
  const moduleQuiz = QUIZ_MAP.get(`m:${mod.id}`);
  const lessonKey = `${course.label}|${mod.title}|${les.title}`;

  const courseTotal = modules.reduce((s, m) => s + m.lessons.length, 0);
  const isFirst = modIdx === 0 && lesIdx === 0 && !showModQuiz;
  const isLast = modIdx === modules.length - 1 && lesIdx === mod.lessons.length - 1 && (showModQuiz || !moduleQuiz);

  const scrollTop = () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    mainRef.current?.scrollTo({ top: 0, behavior });
  };

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
    if (showModQuiz) { setShowModQuiz(false); scrollTop(); return; }
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
