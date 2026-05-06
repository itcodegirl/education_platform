import { useEffect, useState } from 'react';

const REDUCED_DATA_QUERY = '(prefers-reduced-data: reduce)';

function readReducedDataPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(REDUCED_DATA_QUERY).matches;
}

export function useReducedData() {
  const [reducedData, setReducedData] = useState(readReducedDataPreference);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(REDUCED_DATA_QUERY);
    const update = (event) => setReducedData(event.matches);

    setReducedData(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener?.(update);
    return () => mediaQuery.removeListener?.(update);
  }, []);

  return reducedData;
}
