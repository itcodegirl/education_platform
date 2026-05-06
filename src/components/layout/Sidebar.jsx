// ═══════════════════════════════════════════════
// SIDEBAR — orchestration wrapper only.
// Tab bar logic lives in SidebarTabBar.
// Module/lesson tree lives in SidebarLessonTree.
// ═══════════════════════════════════════════════

import { useState, memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProgressData, useAuth } from '../../providers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ProfilePopover } from './ProfilePopover';
import { Logo } from '../shared/Logo';
import { SidebarTabBar } from './SidebarTabBar';
import { SidebarLessonTree } from './SidebarLessonTree';
import { getCourseCompletedLessonCount } from '../../utils/lessonKeys';
import { logNavigationDiagnostic } from '../../utils/navigationDiagnostics';

const POPUP_MENU_ITEM_SELECTOR = '[role="menuitem"]';

export const Sidebar = memo(function Sidebar({
  courses,
  courseIdx,
  modIdx,
  lesIdx,
  showModQuiz,
  isOpen,
  isMobile,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onSelectCourse,
  onSelectLesson,
  onSelectModQuiz,
  onOpenTool,
  activePanel,
}) {
  const isDesktopCollapsed = !isMobile && isCollapsed;
  const { completed = [] } = useProgressData();
  const { user } = useAuth();
  const [lockMode, setLockMode] = useLocalStorage('chw-lock-mode', false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activePopout, setActivePopout] = useState(null); // 'courses' | 'resources' | null
  const [popoutPos, setPopoutPos] = useState(null);
  const [expandedMod, setExpandedMod] = useState(modIdx);
  const tabsRef = useRef(null);
  const popoutRef = useRef(null);
  const asideRef = useRef(null);
  const coursesTabRef = useRef(null);
  const resourcesTabRef = useRef(null);
  const course = courses[courseIdx];
  const modules = course.modules;
  const completedSet = useMemo(() => new Set(completed), [completed]);

  useEffect(() => { setExpandedMod(modIdx); }, [modIdx]);

  const computePopoutPos = useCallback(() => ({ mode: 'docked' }), []);

  const getPopoutItems = useCallback(() => {
    if (!popoutRef.current) return [];
    return Array.from(popoutRef.current.querySelectorAll(POPUP_MENU_ITEM_SELECTOR));
  }, []);

  const focusPopoutItem = useCallback((target = 'first') => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const items = getPopoutItems();
        if (!items.length) return;
        const nextIndex = target === 'last' ? items.length - 1 : 0;
        items[nextIndex].focus();
      });
    });
  }, [getPopoutItems]);

  const closePopout = useCallback((restoreFocus = false, source = activePopout) => {
    setActivePopout(null);
    setPopoutPos(null);
    if (!restoreFocus || !source) return;
    window.requestAnimationFrame(() => {
      if (source === 'courses') { coursesTabRef.current?.focus(); return; }
      resourcesTabRef.current?.focus();
    });
  }, [activePopout]);

  const openPopout = useCallback((which, focusTarget = null) => {
    setActivePopout((prev) => {
      const next = prev === which ? null : which;
      const nextPos = next ? computePopoutPos() : null;
      setPopoutPos(nextPos);
      logNavigationDiagnostic('sidebar-tab-state-updated', {
        targetTab: which, previousTab: prev || '', activeTab: next || '', mode: nextPos?.mode || 'closed',
      });
      if (next && focusTarget) focusPopoutItem(focusTarget);
      return next;
    });
  }, [computePopoutPos, focusPopoutItem]);

  const handleSidebarTabClick = useCallback((which) => {
    logNavigationDiagnostic('sidebar-tab-click-fired', { targetTab: which, activeTab: activePopout || '' });
    openPopout(which);
  }, [activePopout, openPopout]);

  const focusPopoutByOffset = useCallback((offset) => {
    const items = getPopoutItems();
    if (!items.length) return;
    const activeElementIndex = items.findIndex((item) => item === document.activeElement);
    const startIndex = activeElementIndex < 0 ? 0 : activeElementIndex;
    const nextIndex = (startIndex + offset + items.length) % items.length;
    items[nextIndex].focus();
  }, [getPopoutItems]);

  const handleTabKeyDown = useCallback((which) => (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (activePopout === which) { focusPopoutByOffset(1); } else { openPopout(which, 'first'); }
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (activePopout === which) { focusPopoutByOffset(-1); } else { openPopout(which, 'last'); }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activePopout === which) { closePopout(true, which); } else { openPopout(which, 'first'); }
      return;
    }
    if (event.key === 'Escape' && activePopout === which) {
      event.preventDefault();
      closePopout(true, which);
    }
  }, [activePopout, closePopout, focusPopoutByOffset, openPopout]);

  const handlePopoutKeyDown = useCallback((event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); focusPopoutByOffset(1); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); focusPopoutByOffset(-1); return; }
    if (event.key === 'Home') { event.preventDefault(); focusPopoutItem('first'); return; }
    if (event.key === 'End') { event.preventDefault(); focusPopoutItem('last'); return; }
    if (event.key === 'Escape') { event.preventDefault(); closePopout(true); return; }
    if (event.key === 'Tab') { closePopout(false); }
  }, [closePopout, focusPopoutByOffset, focusPopoutItem]);

  useEffect(() => {
    if (!isDesktopCollapsed || !activePopout) return;
    closePopout(false);
  }, [activePopout, closePopout, isDesktopCollapsed]);

  useEffect(() => {
    const navElement = document.getElementById('course-sidebar');
    if (!navElement) return undefined;
    const focusableElements = Array.from(
      navElement.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'),
    );
    if (isDesktopCollapsed) {
      focusableElements.forEach((element) => {
        if (!element.hasAttribute('data-prev-tabindex')) {
          element.setAttribute('data-prev-tabindex', element.getAttribute('tabindex') ?? '__none__');
        }
        element.setAttribute('tabindex', '-1');
      });
      return undefined;
    }
    focusableElements.forEach((element) => {
      const previousTabIndex = element.getAttribute('data-prev-tabindex');
      if (previousTabIndex === null) return;
      if (previousTabIndex === '__none__') { element.removeAttribute('tabindex'); }
      else { element.setAttribute('tabindex', previousTabIndex); }
      element.removeAttribute('data-prev-tabindex');
    });
    return undefined;
  }, [isDesktopCollapsed]);

  useEffect(() => {
    if (!activePopout) return undefined;
    const handlePointerDown = (e) => {
      const inTabs = tabsRef.current && tabsRef.current.contains(e.target);
      const inPopout = popoutRef.current && popoutRef.current.contains(e.target);
      if (!inTabs && !inPopout) { setActivePopout(null); setPopoutPos(null); }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') { setActivePopout(null); setPopoutPos(null); }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activePopout]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';
  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'C';

  const { total, courseDone, pct } = useMemo(() => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = getCourseCompletedLessonCount(completedSet, course);
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { total: totalLessons, courseDone: completedLessons, pct: progressPct };
  }, [modules, completedSet, course]);

  const togglePopover = useCallback(() => setPopoverOpen((v) => !v), []);
  const closePopover = useCallback(() => setPopoverOpen(false), []);

  const handleLessonSelect = useCallback((module, lesson, mi, li, unlocked) => {
    logNavigationDiagnostic('lesson-click-fired', {
      targetLessonId: lesson?.id || '',
      targetModuleId: module?.id || '',
      targetModuleIndex: mi,
      targetLessonIndex: li,
      unlocked,
      lockMode,
    });
    if (!unlocked) return;
    onSelectLesson(mi, li);
  }, [lockMode, onSelectLesson]);

  useFocusTrap(asideRef, {
    enabled: isMobile && isOpen,
    onEscape: onClose,
    lockBodyScroll: true,
  });

  return (
    <>
      {isMobile && isOpen && <div className="overlay overlay-open" onClick={onClose} aria-hidden="true" />}
      <div
        ref={asideRef}
        className="sidebar-shell"
        role={isMobile && isOpen ? 'dialog' : undefined}
        aria-modal={isMobile && isOpen ? 'true' : undefined}
        aria-label={isMobile && isOpen ? 'Course navigation' : undefined}
        aria-hidden={isMobile ? !isOpen : undefined}
        tabIndex={isMobile ? -1 : undefined}
      >
        <nav
          id="course-sidebar"
          className={`sidebar ${isOpen ? 'open' : ''} ${!isMobile && isCollapsed ? 'collapsed' : ''}`}
          aria-label="Course navigation"
          aria-hidden={isDesktopCollapsed ? 'true' : undefined}
          inert={isDesktopCollapsed ? '' : undefined}
        >
          <header className="sidebar-head">
            <div className="brand">
              <Logo size="sm" />
              <span className="brand-robot" aria-hidden="true">🤖</span>
              <Logo size="icon" className="brand-icon-only" />
            </div>
            <div className="sidebar-head-actions">
              <button
                type="button"
                className={`sidebar-avatar ${popoverOpen ? 'active' : ''}`}
                onClick={togglePopover}
                aria-label="Open profile and stats"
                aria-expanded={popoverOpen}
                title={displayName}
              >
                {userInitial}
              </button>
              {!isMobile && (
                <button
                  type="button"
                  className="sidebar-collapse"
                  onClick={onToggleCollapse}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? '»' : '«'}
                </button>
              )}
              <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close sidebar">✕</button>
            </div>
          </header>

          <ProfilePopover isOpen={popoverOpen} onClose={closePopover} isMobile={isMobile} />

          <SidebarTabBar
            courses={courses}
            courseIdx={courseIdx}
            course={course}
            courseDone={courseDone}
            total={total}
            pct={pct}
            activePopout={activePopout}
            popoutPos={popoutPos}
            tabsRef={tabsRef}
            popoutRef={popoutRef}
            coursesTabRef={coursesTabRef}
            resourcesTabRef={resourcesTabRef}
            activePanel={activePanel}
            onTabClick={handleSidebarTabClick}
            onTabKeyDown={handleTabKeyDown}
            onPopoutKeyDown={handlePopoutKeyDown}
            onSelectCourse={onSelectCourse}
            onOpenTool={onOpenTool}
            onClosePopout={() => { setActivePopout(null); setPopoutPos(null); }}
          />

          <SidebarLessonTree
            course={course}
            modules={modules}
            modIdx={modIdx}
            lesIdx={lesIdx}
            showModQuiz={showModQuiz}
            completedSet={completedSet}
            lockMode={lockMode}
            setLockMode={setLockMode}
            expandedMod={expandedMod}
            onSetExpandedMod={setExpandedMod}
            onLessonClick={handleLessonSelect}
            onSelectModQuiz={onSelectModQuiz}
            onOpenTool={onOpenTool}
            activePanel={activePanel}
          />
        </nav>
      </div>
    </>
  );
});
