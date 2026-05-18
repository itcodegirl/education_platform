// ═══════════════════════════════════════════════
// usePanels — Manages panel/overlay visibility
// Extracted from App.jsx for clarity
// ═══════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TIMING, MILESTONES } from '../utils/helpers';
import { getLearnerStorageKey, getLegacyStorageKey } from '../utils/learnerStorageKeys';

const PANEL_HISTORY_KEY = 'chwPanel';
const LEGACY_PANEL_HISTORY_KEY = 'cinovaPanel';

export function getPanelFromHistoryState(state) {
  return state?.[PANEL_HISTORY_KEY] || state?.[LEGACY_PANEL_HISTORY_KEY] || null;
}

export function parseStoredBoolean(rawValue) {
  if (rawValue === null || rawValue === undefined) return false;

  try {
    return JSON.parse(rawValue) === true;
  } catch {
    return rawValue === 'true' || rawValue === '1';
  }
}

function createPanelHistoryState(name) {
  const currentState = { ...(window.history.state || {}) };
  delete currentState[LEGACY_PANEL_HISTORY_KEY];
  return { ...currentState, [PANEL_HISTORY_KEY]: name };
}

function hasCompletedOnboarding(user) {
  if (typeof window === 'undefined') return false;
  const userId = user?.id || '';
  const scopedKey = getLearnerStorageKey('chw-onboarded', userId);
  const legacyKey = getLegacyStorageKey('chw-onboarded');
  const scopedValue = window.localStorage.getItem(scopedKey);

  if (scopedValue !== null) return parseStoredBoolean(scopedValue);

  const legacyValue = window.localStorage.getItem(legacyKey);
  if (legacyValue === null) return false;

  try {
    window.localStorage.setItem(scopedKey, legacyValue);
    if (userId) window.localStorage.removeItem(legacyKey);
  } catch {
    // If migration fails, the legacy value still means this learner
    // already saw onboarding in the current browser.
  }

  return parseStoredBoolean(legacyValue);
}

export function usePanels({ dataLoaded, user, lastPosition }) {
  const [panel, setPanel] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const welcomeShown = useRef(false);
  const prevCompleted = useRef(0);
  const panelRef = useRef(null);
  const confettiTimerRef = useRef(null);

  const scheduleConfettiReset = useCallback((duration) => {
    if (confettiTimerRef.current) {
      window.clearTimeout(confettiTimerRef.current);
    }

    confettiTimerRef.current = window.setTimeout(() => {
      confettiTimerRef.current = null;
      setConfetti(false);
    }, duration);
  }, []);

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  useEffect(() => () => {
    if (confettiTimerRef.current) {
      window.clearTimeout(confettiTimerRef.current);
    }
  }, []);

  // Welcome back OR onboarding (once per session)
  useEffect(() => {
    if (dataLoaded && user && !welcomeShown.current) {
      welcomeShown.current = true;
      if ((lastPosition?.time || 0) > 0) {
        setShowWelcome(true);
      } else if (!hasCompletedOnboarding(user)) {
        setShowOnboarding(true);
      }
    }
  }, [dataLoaded, user, lastPosition]);

  useEffect(() => {
    if (user) return;
    welcomeShown.current = false;
    setPanel(null);
    setSidebar(false);
    setShowWelcome(false);
    setShowOnboarding(false);
    setShowCourseComplete(false);
    setConfetti(false);
    if (confettiTimerRef.current) {
      window.clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = null;
    }
  }, [user]);

  // Keep panel state aligned with browser navigation so Back closes
  // overlays before leaving the current page.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPanelFromHistory = () => {
      const nextPanel = getPanelFromHistoryState(window.history.state);
      if (panelRef.current !== nextPanel) {
        setPanel(nextPanel);
      }
    };

    syncPanelFromHistory();
    window.addEventListener('popstate', syncPanelFromHistory);
    return () => window.removeEventListener('popstate', syncPanelFromHistory);
  }, []);

  // Confetti on milestones
  const checkMilestone = useCallback((completedCount) => {
    const prev = prevCompleted.current;
    if (prev > 0 && MILESTONES.some((m) => prev < m && completedCount >= m)) {
      setConfetti(true);
      scheduleConfettiReset(TIMING.confettiDuration);
    }
    prevCompleted.current = completedCount;
  }, [scheduleConfettiReset]);

  // Course completion celebration
  const triggerCourseComplete = useCallback(() => {
    setShowCourseComplete(true);
    setConfetti(true);
    scheduleConfettiReset(TIMING.courseConfettiDuration);
  }, [scheduleConfettiReset]);

  const closePanel = useCallback(() => {
    if (typeof window !== 'undefined' && getPanelFromHistoryState(window.history.state)) {
      window.history.back();
      return;
    }
    setPanel(null);
  }, []);

  const openPanel = useCallback((name) => {
    if (typeof window === 'undefined') {
      setPanel(name);
      return;
    }

    const nextState = createPanelHistoryState(name);
    window.history.pushState(nextState, '', window.location.href);
    setPanel(name);
  }, []);

  const togglePanel = useCallback((name) => {
    if (panel === name) {
      closePanel();
      return;
    }
    openPanel(name);
  }, [closePanel, openPanel, panel]);

  return useMemo(() => ({
    panel, setPanel, closePanel, togglePanel,
    sidebar, setSidebar,
    showWelcome, setShowWelcome,
    showOnboarding, setShowOnboarding,
    showCourseComplete, setShowCourseComplete,
    confetti,
    checkMilestone,
    triggerCourseComplete,
  }), [
    checkMilestone,
    closePanel,
    confetti,
    panel,
    showCourseComplete,
    showOnboarding,
    showWelcome,
    sidebar,
    togglePanel,
    triggerCourseComplete,
  ]);
}
