// ═══════════════════════════════════════════════
// useNavigation — Course/module/lesson navigation
// Syncs state with URL via React Router
// ═══════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { COURSES, QUIZ_MAP } from '../data';

// Map course ID string to array index
const COURSE_ID_MAP = Object.fromEntries(COURSES.map((c, i) => [c.id, i]));

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function useNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const mainRef = useRef(null);
  const initializedFromUrl = useRef(false);

  // ─── State ─────────────────────────────────────
  const [courseIdx, setCourseIdx] = useState(() => {
    const ci = COURSE_ID_MAP[params.courseId];
    return ci !== undefined ? ci : 0;
  });
  const [modIdx, setModIdx] = useState(() => {
    const mi = parseInt(params.modIdx);
    return isNaN(mi) ? 0 : mi;
  });
  const [lesIdx, setLesIdx] = useState(() => {
    if (params.lesIdx === 'quiz') return 0;
    const li = parseInt(params.lesIdx);
    return isNaN(li) ? 0 : li;
  });
  const [showModQuiz, setShowModQuiz] = useState(() => params.lesIdx === 'quiz');

  // ─── Derived values ────────────────────────────
  const course = COURSES[courseIdx];
  const modules = course.modules;
  const mod = modules[clamp(modIdx, 0, modules.length - 1)];
  const les = mod.lessons[clamp(lesIdx, 0, mod.lessons.length - 1)];
  const isLastLesson = lesIdx === mod.lessons.length - 1;
  const lessonQuiz = QUIZ_MAP.get(`l:${les.id}`);
  const moduleQuiz = QUIZ_MAP.get(`m:${mod.id}`);
  const lessonKey = `${course.label}|${mod.title}|${les.title}`;

  const courseTotal = modules.reduce((s, m) => s + m.lessons.length, 0);
  const isFirst = modIdx === 0 && lesIdx === 0 && !showModQuiz;
  const isLast = modIdx === modules.length - 1 && lesIdx === mod.lessons.length - 1 && (showModQuiz || !moduleQuiz);

  // ─── URL helpers ───────────────────────────────
  const buildPath = useCallback((ci, mi, li, quiz = false) => {
    const cId = COURSES[ci].id;
    if (quiz) return `/course/${cId}/${mi}/quiz`;
    return `/course/${cId}/${mi}/${li}`;
  }, []);

  const scrollTop = () => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  // ─── Sync from URL on route changes ────────────
  useEffect(() => {
    if (!params.courseId) return;

    const ci = COURSE_ID_MAP[params.courseId];
    if (ci === undefined) return;

    const crs = COURSES[ci];
    const mi = clamp(parseInt(params.modIdx) || 0, 0, crs.modules.length - 1);
    const isQuiz = params.lesIdx === 'quiz';
    const li = isQuiz ? 0 : clamp(parseInt(params.lesIdx) || 0, 0, crs.modules[mi].lessons.length - 1);

    setCourseIdx(ci);
    setModIdx(mi);
    setLesIdx(li);
    setShowModQuiz(isQuiz);
  }, [location.pathname]);

  // ─── Navigation functions ──────────────────────
  const go = useCallback((mi, li) => {
    setModIdx(mi);
    setLesIdx(li);
    setShowModQuiz(false);
    navigate(buildPath(courseIdx, mi, li), { replace: false });
    scrollTop();
  }, [courseIdx, navigate, buildPath]);

  const switchCourse = useCallback((ci) => {
    if (ci < 0 || ci >= COURSES.length) return;
    setCourseIdx(ci);
    setModIdx(0);
    setLesIdx(0);
    setShowModQuiz(false);
    navigate(buildPath(ci, 0, 0), { replace: false });
    scrollTop();
  }, [navigate, buildPath]);

  const next = useCallback(() => {
    if (showModQuiz) {
      setShowModQuiz(false);
      if (modIdx < modules.length - 1) {
        go(modIdx + 1, 0);
      } else {
        navigate(buildPath(courseIdx, modIdx, lesIdx), { replace: true });
      }
      return;
    }
    if (isLastLesson && moduleQuiz && !showModQuiz) {
      setShowModQuiz(true);
      navigate(buildPath(courseIdx, modIdx, 0, true), { replace: false });
      scrollTop();
      return;
    }
    if (lesIdx < mod.lessons.length - 1) go(modIdx, lesIdx + 1);
    else if (modIdx < modules.length - 1) go(modIdx + 1, 0);
  }, [modIdx, lesIdx, showModQuiz, isLastLesson, moduleQuiz, mod.lessons.length, modules.length, go, courseIdx, navigate, buildPath]);

  const prev = useCallback(() => {
    if (showModQuiz) {
      setShowModQuiz(false);
      navigate(buildPath(courseIdx, modIdx, lesIdx), { replace: true });
      scrollTop();
      return;
    }
    if (lesIdx > 0) go(modIdx, lesIdx - 1);
    else if (modIdx > 0) go(modIdx - 1, modules[modIdx - 1].lessons.length - 1);
  }, [modIdx, lesIdx, showModQuiz, modules, go, courseIdx, navigate, buildPath]);

  const goToSearch = useCallback((ci, mi, li) => {
    setCourseIdx(ci);
    setModIdx(mi);
    setLesIdx(li);
    setShowModQuiz(false);
    navigate(buildPath(ci, mi, li), { replace: false });
    scrollTop();
  }, [navigate, buildPath]);

  const goToModQuiz = useCallback((mi) => {
    setModIdx(mi);
    setLesIdx(modules[mi].lessons.length - 1);
    setShowModQuiz(true);
    navigate(buildPath(courseIdx, mi, 0, true), { replace: false });
    scrollTop();
  }, [modules, courseIdx, navigate, buildPath]);

  return {
    courseIdx, modIdx, lesIdx, showModQuiz,
    course, modules, mod, les,
    lessonKey, lessonQuiz, moduleQuiz,
    courseTotal, isFirst, isLast, isLastLesson,
    mainRef,
    go, next, prev, switchCourse, goToSearch, goToModQuiz,
    setShowModQuiz,
  };
}
