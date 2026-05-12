# Performance Evidence

Last updated: May 12, 2026

Use this guide when reviewing PRs that touch routing, Vite chunking, global CSS, Monaco/editor, export tools, course data, service worker behavior, or public/auth entry points.

## Current Proof Points

Local verification on this branch:

- Production build succeeds.
- Initial JavaScript gzip: about 84.12 kB, under the 170 kB budget.
- Initial CSS gzip: about 8.21 kB, under the 12 kB budget.
- Monaco, Supabase, and protected app styles are not preloaded from the entry HTML.
- `jspdf` and `html2canvas` are blocked from static source imports and entry HTML preloads.

## CI Artifacts

The Lighthouse CI workflow uploads two short-lived artifact groups:

| Artifact | What to inspect | Why it matters |
| --- | --- | --- |
| `lighthouse-ci-*` | Mobile and desktop reports from `.lighthouseci/` | Confirms performance, accessibility, best-practices, SEO, and PWA behavior against the preview build. |
| `bundle-summary-*` | `dist/bundle-summary.json` and `dist/bundle-review-summary.md` | Records initial JS/CSS gzip totals, top chunks, active budgets, budget/preload failures, and a reviewer-ready Markdown summary. |

On pull requests, CI also maintains a single bundle review comment marked with `codeherway-bundle-review-summary` so reviewers can see budget headroom without downloading artifacts.

## Review Checklist

1. Confirm `npm run audit:performance` passed.
2. Compare `bundle-summary.json` and the PR bundle review comment against `docs/performance-budget.md`.
3. Check that initial JS and CSS gzip remain below budget.
4. Check that Monaco/editor, jsPDF, html2canvas, Supabase, and course data stay lazy and absent from public entry preloads.
5. Review mobile and desktop Lighthouse artifacts for score regressions, LCP, CLS, and Total Blocking Time.
6. If the PR changes authenticated lesson flows, capture React Profiler notes for lesson navigation, panel switching, quiz submission, or challenge editor open.

## Known Limits

- Lighthouse uses the public entry route. Authenticated learner performance still needs browser traces from a credentialed staging run.
- The PDF export dependency is intentionally allowed as a lazy interaction chunk. It should not move into shared app code.
- Do not cite a Lighthouse score in reviewer materials until it comes from a completed CI run or a local run captured with the same config.

## Escalation Rules

- Do not raise a bundle budget just to pass CI.
- Split course data by module if a course runtime chunk approaches its budget.
- Move styles into route or component-owned files if protected app CSS approaches its gzip budget.
- Keep export and editor tooling behind explicit user intent.
