import { useEffect } from 'react';

const DEFAULT_SUFFIX = 'CodeHerWay';
const APP_DEFAULT_TITLE = 'CodeHerWay - Learn. Build. Ship.';

// Sets document.title to "<title> - CodeHerWay" for the lifetime
// of the calling component, then restores the global default on
// unmount. Skip the update when title is empty so route-level pages
// can opt out (e.g. while a critical error screen is up).
export function useDocumentTitle(title, options = {}) {
  const { suffix = DEFAULT_SUFFIX, restore = APP_DEFAULT_TITLE } = options;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (!title) return undefined;

    const previous = document.title;
    document.title = suffix ? `${title} - ${suffix}` : title;

    return () => {
      document.title = restore || previous;
    };
  }, [title, suffix, restore]);
}
