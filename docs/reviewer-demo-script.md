# Reviewer Demo Script

This walkthrough is designed for a five-minute recruiter or technical review. It shows the product path, the trust posture, and the engineering depth without asking the reviewer to discover everything manually.

## Setup

Run:

```bash
npm install
npm run dev
```

Optional quality pass:

```bash
npm run check
npm run audit:quizzes
npm run audit:content
```

## Five-Minute Flow

1. Open the app and start at the public landing or first-lesson preview.
2. Enter the learning app and point out the current primary action: read the lesson, then complete it.
3. Complete one lesson and show the progress feedback, XP feedback, and updated course status.
4. Open saved lessons, notes, review queue, badges, and challenges. Explain which tools are motivational/local today and which writes may sync.
5. Submit a quiz, retry it, and point out that retrying is for practice while XP is awarded once per quiz milestone.
6. Open Progress Summary and call out that it is not a verified credential.
7. Close with the roadmap and trust boundaries: portfolio-ready now, production-ready after stable IDs, backend reward records, authenticated CI, and observability.

## Failure-Path Moment

If demonstrating engineering depth, show the sync warning/retry copy or docs:

- Same-browser queued recovery exists for covered progress writes.
- Backend reward sync is intentionally disabled until migrations and duplicate-award tests pass.
- The app avoids claiming cross-device reward trust before the backend supports it.

## What To Say In An Interview

"I hardened this as a learning-platform case study, not a fake production SaaS claim. The project demonstrates React architecture, learner UX, accessibility, local-first reward logic, Supabase integration planning, and honest trust boundaries. The roadmap separates demo readiness from launch readiness so the project is polished without overstating data durability or credential trust."
