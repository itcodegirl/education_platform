# CodeHerWay Performance Budget

This budget protects the current route-splitting architecture: public auth, protected app shell, course data, Monaco, Supabase, and export tooling must stay independently cacheable and lazy where practical.

## Enforced Budgets

- Initial JavaScript gzip: 95 kB maximum.
- Initial CSS gzip: 12 kB maximum.
- Main app chunk gzip: 120 kB maximum.
- Initial HTML must not modulepreload Monaco, Supabase, protected app styles, auth route chunks, or landing-story chunks.
- Monaco remains lazy and isolated behind the editor surfaces.

## Review Triggers

- Any new dependency above 20 kB gzip needs a lazy-loading reason or a replacement plan.
- Any route component above 30 kB gzip should be split by workflow, not by arbitrary file count.
- Any scroll, resize, orientation, keyboard, or visibility listener must have cleanup coverage.
- Animation work should use opacity/transform and respect reduced motion.
- Mobile routes should avoid loading desktop-only editor and analytics surfaces before user intent.

## Current Baseline

- Initial JavaScript gzip after the performance audit: about 84 kB.
- Initial CSS gzip after the performance audit: about 8.2 kB.
- Remaining large chunks are intentionally lazy: Monaco, course data, jsPDF/html2canvas, Supabase, and protected app CSS.
