# Known Limitations

This project is actively stabilized and is not yet production-grade. The following limitations are known and intentionally documented.

## Repo / Surface

- `codeherway-v2/` is still tracked in-repo as archived/reference-only content.

## Tooling / Verification

- Linting is not yet treated as a stable, required release gate in this repair stage.
- Authenticated E2E scenarios are skipped when auth credentials are not configured in environment variables.

## Learning Integrity

- Learning identity/data model hardening is still pending.
- Quiz identity and lesson/module mapping consistency still needs follow-up repair.
- Quiz inventory still has known data gaps (orphan lesson quizzes, lessons without mapped lesson quizzes, and duplicate lesson quiz variants in some tracks).
- Run `npm run audit:quizzes` for the current inventory report (`npm run audit:quizzes -- --strict` to fail on known integrity gaps).
- XP/streak/challenge trust rules still need hardening against edge cases and abuse paths.

## Search / Content

- Search indexing may not yet cover every structured lesson field.
- Content is source-file based and does not yet use a full CMS workflow.

## Security / Production Hardening

- Production-grade AI/security hardening is outside this documentation batch and remains planned work.
