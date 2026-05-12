# Portfolio Demo Capture Plan

Use this plan to create a short recruiter-facing walkthrough after the current branch is deployed. The goal is to show product judgment, not every feature.

## Recommended Video

Length: 60 to 90 seconds.

Format: desktop recording at 1440x900 or 1600x900, with one short mobile clip or screenshot after the main flow.

## Storyboard

| Time | Scene | What to show | What it proves |
| ---: | --- | --- | --- |
| 0-10s | Public entry | Landing page or first-lesson preview | Clear positioning and calm first impression |
| 10-25s | Lesson workspace | Lesson title, learning contract, current-step strip | Structured learning path, not a generic dashboard |
| 25-40s | Progress action | Complete lesson, show progress/XP feedback | Immediate feedback with honest progress language |
| 40-55s | Learning tools | Open notes, bookmarks, or review queue | Learner continuity beyond a single page |
| 55-70s | Evidence | Open Progress snapshot or quiz result | Progress is separated from mastery evidence |
| 70-90s | Trust close | Show README Evidence & Readiness Snapshot or trust-boundary docs | Product maturity and honest production limits |

## Voiceover / Caption Script

CodeHerWay is a trust-centered learning platform for beginner women entering tech. I hardened the project around a clear lesson path, honest progress tracking, accessible learning tools, and explicit production-readiness gates. The platform is portfolio-ready today, while cross-device reward authority and authenticated production reliability remain gated behind Supabase staging validation.

## Must Show

- One real lesson path, not only the landing page.
- The learning contract: prerequisite, outcome, guided practice, recall, and proof/transfer.
- A progress or readiness surface that says what is local, synced, or not verified.
- At least one mobile or narrow-screen proof point.
- The README evidence table or reviewer evidence map.

## Avoid Showing Until Fixed

- Any claim that Progress Summary is a certificate.
- Any claim that XP, streaks, badges, review queue, or challenges are fully cross-device.
- Lighthouse score claims before `docs/lighthouse-evidence.md` has a dated row from CI.
- Authenticated E2E as required CI coverage until GitHub Actions secrets are configured.

## Capture Checklist

- Use a dedicated demo learner account.
- Clear personal notes, names, or emails before recording.
- Keep browser chrome minimal.
- Prefer dark theme unless the point is theme parity.
- Run `npm run build`, `npm run test`, `npm run lint`, and `npm run typecheck` before recording the final demo.
- Record the deployed commit SHA alongside the video in the portfolio case study.
