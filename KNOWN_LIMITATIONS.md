# Known Limitations

This project is actively stabilized and is not yet production-grade. The following limitations are known and intentionally documented.

## Repo / Surface

- `codeherway-v2/` is still tracked in-repo as archived/reference-only content.

## Tooling / Verification

- The local quality gate covers lint, production build, bundle budget, and unit tests through `npm run check`.
- Authenticated E2E scenarios are skipped when auth credentials are not configured in environment variables.
- Authenticated Playwright storage state is intentionally ignored under `playwright/.auth/` to avoid committing local session files.

## Learning Integrity

- Learning identity/data model hardening is still pending. The local retry/reconciliation reward engine and Supabase backend reward branch have been unified, but production cross-device reward trust still requires applying migrations, validating the RPC/RLS behavior against a real Supabase project, and deciding local import/backfill policy.
- Active lesson quiz coverage is complete for HTML, CSS, JavaScript, and React.
- The platform now ships only the four frontend tracks (HTML, CSS, JS, React); the previous Python track was removed to keep product focus tight.
- Quiz inventory still has known integrity follow-up, but the current orphan lesson quizzes and intentional variant groups are classified by audit metadata rather than left ambiguous.
- Run `npm run audit:quizzes` for the current inventory report (`npm run audit:quizzes -- --strict` to fail on known integrity gaps). Use it to monitor classified orphan quizzes, intentional variant groups, and legacy aliases.
- Cross-course mixed-type quiz entries previously embedded in React quiz data are intentionally archived as inactive exports and excluded from active React lookup.
- Renamed HTML Module 102 lesson IDs resolved duplicate identity risk, but existing progress/bookmark keys for those old lesson IDs may need a later targeted compatibility decision.
- Core same-device reward trust rules are hardened for lesson completion XP, quiz retry rewards, activity-based streaks, and challenge completion dedupe.
- Lesson, quiz, and challenge XP use a local reward-event ledger/processor with legacy reward history as a compatibility guard.
- Failed reward events have a local queue/reconciliation foundation for same-device recovery and inspection.
- Reward engine diagnostics can summarize local ledger/queue health, but they are developer-facing and do not replace backend observability.
- Additive Supabase migrations define `reward_events` and `award_reward_event`, and the frontend has a feature-gated backend reward service wrapper. Backend reward sync remains disabled by default so demos and existing local fallback behavior are preserved.
- Cross-device reward idempotency is backend-ready but not production-complete until those migrations are applied, the feature flag is enabled intentionally, and authenticated duplicate-award behavior is verified.
- Challenge completion persistence is same-device/localStorage-backed and should not be treated as secure certification.
- Challenge auto-grading reads the learner's source text via `string.includes` / regex helpers (see `src/data/{html,css,js}/challenges.js`). It is good enough as a beginner guide rail but is intentionally not robust — a learner can pass requirements like "uses `<nav>`" by adding the substring inside an HTML comment. The CodeChallenge UI now states this explicitly under the test results so the limitation is visible to learners. The infrastructure for DOM-based grading is now in place: `useChallengeSession.runTests` is async and waits for the iframe's `onLoad` (or a 1.5s safety timeout) before grading, so a future migration is data-only — rewrite each test's `check(code, iframe)` to inspect `iframe.contentDocument` instead of regexing the source. Until that data migration lands, the source-text limitation above still applies.
- Direct optimistic progress writes from `ProgressContext` now have same-browser queue replay, including reconnect retry and next-session replay in the same browser.
- Recoverable lesson route mutations for completion toggles and bookmarks now enqueue same-browser retry writes instead of stopping at a generic sync warning.
- Other route-fetcher mutations and backend reward flows still surface advisory sync warnings without the same queued replay/import guarantees.
- The sync warning banner remains intentionally non-destructive for non-queued failures. Hiding a generic warning does not recover a failed route action or promise durable recovery from every cloud-write failure.
- Progress sync queue/replay telemetry is privacy-safe and analytics-gated, but it is not a replacement for backend observability or alerting.
- Supabase/localStorage write failures outside the covered same-browser retry path still mark sync-failed state, but universal backend queue replay/import is still future work.

## Search / Content

- Search indexing may not yet cover every structured lesson field.
- Content is source-file based and does not yet use a full CMS workflow.

## Security / Production Hardening

- Production-grade AI/security hardening is outside this documentation batch and remains planned work.
