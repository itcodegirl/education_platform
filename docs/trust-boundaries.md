# Trust Boundaries

CodeHerWay is portfolio/demo-ready today, not production credentialing infrastructure. This doc makes the product trust boundaries explicit so public copy, reviewer docs, and future implementation stay aligned.

## Trusted By Backend Today

- Supabase Auth sessions.
- Profile access when Supabase is configured and RLS policies are active.
- Lesson completions, bookmarks, and notes when connected writes succeed.

## Same-Browser Recovery Today

- Direct optimistic progress writes can queue and retry in the same browser.
- Recoverable lesson completion and bookmark route-action failures can enter the same local retry path.
- Hiding an advisory warning does not guarantee every failed write was recovered.

## Local-Only Today

- XP.
- Streaks.
- Badges.
- Spaced-repetition review queue.
- Challenge completion history.
- Reward ledger diagnostics.

These are useful learning signals, but they should be described as single-device until backend reward and activity records are verified.

## Informational, Not Credentialed

- Progress Summary PDFs reflect the app's current view of learner progress.
- In-app badges are motivational milestones.
- Challenge auto-grading is a practice aid, not secure certification.

## Future Verified Certificate Boundary

Verified certificates should require all of the following before public launch:

- Server-backed course completion records.
- Stable course/module/lesson identity.
- Immutable issued certificate record.
- Public verification URL.
- Revocation or correction policy.
- Duplicate-award and tamper-resistance tests.

Until those exist, the correct product language is Progress Summary, not certificate.
