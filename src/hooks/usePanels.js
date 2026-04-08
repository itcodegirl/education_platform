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

  // Welcome back OR onboarding (once per session)
  useEffect(() => {
    if (dataLoaded && user && !welcomeShown.current) {
      welcomeShown.current = true;
      if (lastPosition.time > 0) {
        setShowWelcome(true);
      } else if (!localStorage.getItem('chw-onboarded')) {
        setShowOnboarding(true);
      }
    }
  }, [dataLoaded, user, lastPosition]);

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

  const closePanel = () => setPanel(null);
  const togglePanel = (name) => setPanel((p) => (p === name ? null : name));

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
