# Performance Evidence

Last updated: May 12, 2026

Use this guide when reviewing PRs that touch routing, Vite chunking, global CSS, Monaco/editor, export tools, course data, service worker behavior, public/auth entry points, or visual assets.

For signed-in learner flows, pair this file with `docs/authenticated-performance-evidence.md`.
For images, fonts, video, download, or preload changes, pair it with `docs/asset-performance-policy.md`.

## Current Proof Points

Local verification on this branch:

- Production build succeeds.
- Initial JavaScript gzip: about 84.18 kB, under the 170 kB budget.
- Initial CSS gzip: about 8.21 kB, under the 12 kB budget.
- Monaco, Supabase, and protected app styles are not preloaded from the entry HTML.
- `jspdf` and `html2canvas` are blocked from static source imports and entry HTML preloads.
- Browser Web Vitals telemetry is wired through the existing optional analytics path when analytics is configured.

## CI Artifacts

The Lighthouse CI workflow uploads two short-lived artifact groups:

| Artifact | What to inspect | Why it matters |
| --- | --- | --- |
| `lighthouse-ci-*` | Mobile and desktop reports from `.lighthouseci/` | Confirms performance, accessibility, best-practices, SEO, and PWA behavior against the preview build. |
| `bundle-summary-*` | `dist/bundle-summary.json`, optional `dist/bundle-summary.base.json`, and `dist/bundle-review-summary.md` | Records initial JS/CSS gzip totals, top chunks, active budgets, budget/preload failures, and a reviewer-ready Markdown summary with base-branch deltas when available. |

On pull requests, CI also maintains a single bundle review comment marked with `codeherway-bundle-review-summary` so reviewers can see budget headroom and base-branch movement without downloading artifacts.

## Review Checklist

1. Confirm `npm run audit:performance` passed.
2. Compare `bundle-summary.json`, base deltas in the PR bundle review comment, and `docs/performance-budget.md`.
3. Check that initial JS and CSS gzip remain below budget.
4. Check that Monaco/editor, jsPDF, html2canvas, Supabase, and course data stay lazy and absent from public entry preloads.
5. For asset changes, confirm `docs/asset-performance-policy.md` rules were followed before accepting new page weight.
6. Run `npm run audit:asset-sizes` for image, font, video, or downloadable-file changes.
7. Review mobile and desktop Lighthouse artifacts for score regressions, LCP, CLS, and Total Blocking Time.
8. If the PR changes authenticated lesson flows, follow `docs/authenticated-performance-evidence.md` and capture React Profiler notes for lesson navigation, panel switching, quiz submission, challenge editor open, mobile tools, or export intent.

## Production Signals

When analytics is configured, the app records low-cardinality Web Vitals events for `ttfb`, `fcp`, `lcp`, `cls`, and `inp`. These events should be treated as directional production signals and compared with CI bundle/Lighthouse evidence before making performance claims.

## Known Limits

- Lighthouse uses the public entry route. Authenticated learner performance still needs browser traces from a credentialed staging run, documented through `docs/authenticated-performance-evidence.md`.
- The PDF export dependency is intentionally allowed as a lazy interaction chunk. It should not move into shared app code.
- Do not cite a Lighthouse score in reviewer materials until it comes from a completed CI run or a local run captured with the same config.

## Escalation Rules

- Do not raise a bundle budget just to pass CI.
- Split course data by module if a course runtime chunk approaches its budget.
- Move styles into route or component-owned files if protected app CSS approaches its gzip budget.
- Keep export and editor tooling behind explicit user intent.
