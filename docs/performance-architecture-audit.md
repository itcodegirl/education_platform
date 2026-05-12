# Performance Architecture Audit

Date: May 2026
Scope: CodeHerWay Education Platform frontend runtime, route graph, bundle policy, mobile shell, animation cost, and CI guardrails.

## Current Architecture

- Vite + React Router SPA with route-level lazy loading for protected app, profile, admin, public profile, styleguide, auth, guest preview, panels, and overlays.
- Course curriculum is dynamically imported per course through `src/data/loaders.js`; challenge data is loaded separately from lesson runtime data.
- Monaco is lazy-loaded from the challenge/editor surface and manually chunked in `vite.config.js`.
- Bundle enforcement lives in `scripts/check-bundle-size.mjs` and `scripts/bundleBudgetPolicy.mjs`.
- Lighthouse CI config exists in `lighthouserc.json`, but local runs may require network/package access.

## Implemented Fixes

- Split `AuthLayout` out of the initial router chunk so authenticated learners do not pay for landing/auth UI on the protected path.
- Split lesson `AITutor` out of `LessonView` so the tutor service, chat UI, and formatting code load only when the lesson chunk reaches that boundary.
- Stabilized panel and toolbar handlers in `usePanels()` and `useLearningToolActions()` to reduce memo busting in the persistent lesson shell.
- Memoized `PanelManager` progress/context derivation so overlay state changes do less repeated work.
- Parallelized the reward-catalog static audit and gave the heavy integration test an explicit timeout to avoid false failures under cold runners.
- Cleared the mobile keyboard orientation-reset timer and avoided redundant keyboard-open state writes during visual viewport resize.
- Reduced celebration particle count on small/coarse-pointer devices and skipped particle creation when reduced motion is enabled.

## Bottlenecks And Risks

- `ProtectedAppRoutes` remains the largest non-vendor application chunk because it owns the complete lesson workspace, quiz UI, layout shell, panels entrypoint, and learning orchestration.
- Initial CSS is within budget, but the protected app stylesheet is large because many feature styles are globally imported once the authenticated app loads.
- Course data chunks are healthy for lazy loading, but `data-js`, `data-css`, and `data-react` are large enough that future curriculum growth should be watched.
- `jspdf`, `html2canvas`, and Monaco are correctly lazy, but each remains a heavy interaction-path dependency.
- Lighthouse CI now uploads report artifacts for each run; portfolio score claims should still wait for a completed CI artifact from the target branch.
- Some CSS still uses broad `transition: all`; this is acceptable for low-frequency surfaces but should not be expanded into scroll-linked or persistent controls.

## Performance Budget

Recommended guardrails:

- Initial JS gzip: keep under 170 kB; target under 100 kB.
- Initial CSS gzip: keep under 12 kB; target under 10 kB.
- Main app chunk gzip: target under 45 kB.
- Protected app runtime chunk gzip: keep under 40 kB, then split lesson workspace if it crosses 45 kB.
- Per-course data chunk gzip: keep under 75 kB.
- Lazy Monaco chunks: no eager preload; only raise the existing 1900 kB raw cap with a dedicated performance PR.
- Lighthouse: performance >= 0.75 locally or in CI for the public entry route; accessibility >= 0.9 remains mandatory.

## Medium-Term Improvements

- Move more protected feature CSS behind route/surface chunks, starting with admin, profile, and challenge-only styles.
- Split `ProtectedAppRoutes` further by moving quiz, lesson workspace, and persistent layout shell into smaller route-adjacent modules.
- Add the completed PR Lighthouse summary to the portfolio case study after CI runs so score claims reference measured evidence.
- Add a route-manifest budget check that flags accidental static imports from auth, admin, profile, tutor, PDF export, Monaco, and challenge surfaces.
- Add mobile Playwright assertions for touch target size, focused input visibility, and scroll bleed in panels and the mobile tools sheet.

## Scalability Recommendations

- Treat curriculum growth as data growth: add budget rows per course family instead of relaxing the general JavaScript chunk budget.
- Keep AI, PDF export, editor, admin, and analytics integrations behind explicit interaction or route boundaries.
- Prefer stable context values and selectors for persistent shell state before adding new providers.
- Avoid global CSS imports for features that are not visible in the first protected lesson workspace.
- Keep every new heavy dependency tied to an owner surface and a budget entry.
