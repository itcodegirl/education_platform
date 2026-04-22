// ═══════════════════════════════════════════════
// usePanels — Manages panel/overlay visibility
// Extracted from App.jsx for clarity
// ═══════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { TIMING, MILESTONES } from '../utils/helpers';

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

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  // Welcome back OR onboarding (once per session)
  useEffect(() => {
    if (dataLoaded && user && !welcomeShown.current) {
      welcomeShown.current = true;
      if ((lastPosition?.time || 0) > 0) {
        setShowWelcome(true);
      } else if (!localStorage.getItem('chw-onboarded')) {
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
  }, [user]);

  // Keep panel state aligned with browser navigation so Back closes
  // overlays before leaving the current page.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPanelFromHistory = () => {
      const nextPanel = window.history.state?.cinovaPanel || null;
      if (panelRef.current !== nextPanel) {
        setPanel(nextPanel);
      }
    };

    syncPanelFromHistory();
    window.addEventListener('popstate', syncPanelFromHistory);
    return () => window.removeEventListener('popstate', syncPanelFromHistory);
  }, []);

  // Confetti on milestones
  const checkMilestone = (completedCount) => {
    const prev = prevCompleted.current;
    if (prev > 0 && MILESTONES.some((m) => prev < m && completedCount >= m)) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), TIMING.confettiDuration);
    }
    prevCompleted.current = completedCount;
  };

  // Course completion celebration
  const triggerCourseComplete = () => {
    setShowCourseComplete(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), TIMING.courseConfettiDuration);
  };

  const closePanel = () => {
    if (typeof window !== 'undefined' && window.history.state?.cinovaPanel) {
      window.history.back();
      return;
    }
    setPanel(null);
  };

  const openPanel = (name) => {
    if (typeof window === 'undefined') {
      setPanel(name);
      return;
    }

    const nextState = { ...(window.history.state || {}), cinovaPanel: name };
    window.history.pushState(nextState, '', window.location.href);
    setPanel(name);
  };

  const togglePanel = (name) => {
    if (panel === name) {
      closePanel();
      return;
    }
    openPanel(name);
  };

  return {
    panel, setPanel, closePanel, togglePanel,
    sidebar, setSidebar,
    showWelcome, setShowWelcome,
    showOnboarding, setShowOnboarding,
    showCourseComplete, setShowCourseComplete,
    confetti,
    checkMilestone,
    triggerCourseComplete,
  };
}
