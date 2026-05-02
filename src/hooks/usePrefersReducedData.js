import { useEffect, useState } from 'react';

// Returns true when the learner has signaled that they want lighter
// pages — either via the Data Saver toggle exposed by the Network
// Information API (navigator.connection.saveData) or via the
// `prefers-reduced-data` CSS media query (Chromium-only today, but
// safe to read elsewhere).
//
// Used to swap heavyweight desktop UI (Monaco) for the lighter
// textarea path. Falls back to false anywhere the API is missing.
export function usePrefersReducedData() {
  const [reduced, setReduced] = useState(getInitialReducedState);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const cleanups = [];

    const mql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-data: reduce)')
        : null;
    if (mql) {
      const handler = () => setReduced(currentlyReduced());
      mql.addEventListener('change', handler);
      cleanups.push(() => mql.removeEventListener('change', handler));
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && typeof conn.addEventListener === 'function') {
      const handler = () => setReduced(currentlyReduced());
      conn.addEventListener('change', handler);
      cleanups.push(() => conn.removeEventListener('change', handler));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return reduced;
}

function getInitialReducedState() {
  if (typeof window === 'undefined') return false;
  return currentlyReduced();
}

function currentlyReduced() {
  if (typeof window === 'undefined') return false;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.saveData === true) return true;

  if (typeof window.matchMedia === 'function') {
    const mql = window.matchMedia('(prefers-reduced-data: reduce)');
    if (mql && mql.matches) return true;
  }

  return false;
}
