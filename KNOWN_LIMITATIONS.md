# Known Limitations

This project is actively stabilized and is not yet production-grade. The following limitations are known and intentionally documented.

## Repo / Surface

- `codeherway-v2/` is still tracked in-repo as archived/reference-only content.

## Tooling / Verification

- Linting is not yet treated as a stable, required release gate in this repair stage.
- Authenticated E2E scenarios are skipped when auth credentials are not configured in environment variables.

## Learning Integrity

- Learning identity/data model hardening is still pending.
- Active lesson quiz coverage is complete for HTML, CSS, JavaScript, and React.
- Python quizzes are intentionally deferred/roadmap work, so the audit still reports Python lessons without matching lesson quizzes.
- Quiz inventory still has known integrity follow-up: orphan lesson quizzes, duplicate lesson quiz variant groups, legacy aliases, and archived cross-course entries.
- Run `npm run audit:quizzes` for the current inventory report (`npm run audit:quizzes -- --strict` to fail on known integrity gaps). Use it to monitor orphan quizzes, variant groups, legacy aliases, and deferred Python quiz coverage.
- Cross-course mixed-type quiz entries previously embedded in React quiz data are intentionally archived as inactive exports and excluded from active React lookup.
- XP/streak/challenge trust rules still need hardening against edge cases and abuse paths.

## Search / Content

- Search indexing may not yet cover every structured lesson field.
- Content is source-file based and does not yet use a full CMS workflow.

## Security / Production Hardening

- Production-grade AI/security hardening is outside this documentation batch and remains planned work.
