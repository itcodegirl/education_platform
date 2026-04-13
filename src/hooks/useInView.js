// ═══════════════════════════════════════════════
// useInView — IntersectionObserver wrapper that sets
// an `inView` boolean the first time the element
// enters the viewport. Used by scroll-driven
// animations so we don't need GSAP or ScrollTrigger.
//
//   const [ref, inView] = useInView({ threshold: 0.3 });
//   <div ref={ref} className={inView ? 'show' : ''} />
//
// Honors prefers-reduced-motion: if the user has it
// set, we set inView=true immediately so content is
// visible without animation.
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';

export function useInView({ threshold = 0.2, rootMargin = '0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect reduced motion: show everything immediately, skip observers.
    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      setInView(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}
