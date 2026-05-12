# Lighthouse Evidence

Use this file to record measured Lighthouse results for reviewer-facing releases. The CI config and bundle checks are useful guardrails, but they are not a substitute for a dated score capture.

## Current Capture Status

No current Lighthouse score artifact is committed yet.

## Required Capture

- Route: public entry route, `http://127.0.0.1:4319/`
- Command: `npm run build && npm run test:lighthouse`
- Config: `lighthouserc.json`
- Minimum scores from config:
  - Performance: `0.60`
  - Accessibility: `0.90`
  - Best practices: `0.90`
  - SEO: `0.85`

## Result Template

| Date | Route | Device preset | Performance | Accessibility | Best practices | SEO | Notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| TBD | `/` | desktop | TBD | TBD | TBD | TBD | Add the LHCI temporary URL or local report path. |

## Reviewer Note

Until this table has a dated score row, claim bundle guardrails and lazy-loading discipline, not proven Lighthouse performance.
