# Known Limitations

This project is actively stabilized and is not yet production-grade. The following limitations are known and intentionally documented.

## Repo / Surface

- `codeherway-v2/` is still tracked in-repo as archived/reference-only content.

## Tooling / Verification

- Linting is not yet treated as a stable, required release gate in this repair stage.
- Authenticated E2E scenarios are skipped when auth credentials are not configured in environment variables.

## Learning Integrity

- Learning identity/data model hardening is still pending, especially server-side reward-event tracking and cross-device reconciliation.
- Active lesson quiz coverage is complete for HTML, CSS, JavaScript, and React.
- Python quizzes are intentionally deferred/roadmap work, so the audit still reports Python lessons without matching lesson quizzes.
- Future Python quiz policy should define learner-friendly module checkpoints first, then decide whether every Python lesson needs a dedicated lesson quiz.
- Quiz inventory still has known integrity follow-up, but the current orphan lesson quizzes and intentional variant groups are classified by audit metadata rather than left ambiguous.
- Run `npm run audit:quizzes` for the current inventory report (`npm run audit:quizzes -- --strict` to fail on known integrity gaps). Use it to monitor classified orphan quizzes, intentional variant groups, legacy aliases, and deferred Python quiz coverage.
- Cross-course mixed-type quiz entries previously embedded in React quiz data are intentionally archived as inactive exports and excluded from active React lookup.
- Renamed HTML Module 102 lesson IDs resolved duplicate identity risk, but existing progress/bookmark keys for those old lesson IDs may need a later targeted compatibility decision.
- Core same-device reward trust rules are hardened for lesson completion XP, quiz retry rewards, activity-based streaks, and challenge completion dedupe.
- Reward idempotency currently relies on client/local reward history plus existing progress data; a server-side reward-event ledger or atomic XP award operation is still future work.
- Challenge completion persistence is same-device/localStorage-backed and should not be treated as secure certification.
- Supabase/localStorage write failures now mark sync-failed state in core flows, but there is no durable retry queue or reconciliation workflow yet.

## Search / Content

- Search indexing may not yet cover every structured lesson field.
- Content is source-file based and does not yet use a full CMS workflow.

## Security / Production Hardening

- Production-grade AI/security hardening is outside this documentation batch and remains planned work.
