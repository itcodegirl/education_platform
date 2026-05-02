# Screenshot Capture Guide

A recruiter-facing portfolio set. Each capture should be saved as
the filename below and committed to this directory. The top-level
`README.md` references these names directly.

Recommended capture size: 1600x900 or 1920x1080. Use the dark theme
unless a screenshot is specifically about light-theme parity. Crop
chrome aggressively so the actual product is the visual subject.

## Capture set

### `01-landing-auth.png`

The unauthenticated landing page (`/` while logged out).

State to set up:
- Sign out, then load the root URL.
- Wait for the hero copy and CTAs to render.
- Capture the full landing hero plus the sign-up form below the
  fold if it fits without scrolling — otherwise capture the hero
  alone.

What this proves:
- Brand identity, design system, hierarchy, calls to action.

### `02-dashboard-first-run.png`

The first-lesson view for a brand-new account.

State to set up:
- Sign in as a learner that has not completed a single lesson.
- Land on the default course (HTML).
- The "First login" starter guide should be visible at the top.

What this proves:
- Onboarding clarity, calm visual pacing, the lesson view as
  context for everything else in this set.

### `03-lesson-flow.png`

A mid-track lesson with the editor + preview tabs visible.

State to set up:
- Open any lesson that has a `code` field (the HTML "Headings &
  Paragraphs" lesson is reliable).
- Click into the editor tab so Monaco is loaded.
- Optionally click "Preview" right before capture so the iframe is
  rendered too.

What this proves:
- Real code editor integration (Monaco), iframe sandboxing, the
  lesson chrome (header + tasks + AI Tutor entry point).

### `04-tools-panels.png`

A side panel open over the lesson view.

State to set up:
- Open the Glossary or Search panel from the bottom toolbar
  (desktop) — both are visually rich.
- Type a short query so results are populated.

What this proves:
- The platform is more than a single page — there's a real toolset
  the learner can pull up while reading.

### `05-profile-progress.png`

The Profile / progress page with at least one completed lesson and
ideally one earned badge.

State to set up:
- Complete one or two lessons in any course so XP, level, and a
  course progress chip are populated.
- Navigate to `/profile` and capture the top of the page where the
  level / XP / streak / course progress chart sits together.

What this proves:
- Persisted progress state, the gamification layer, the platform
  acknowledging the learner's effort.

## Optional captures

- `06-mobile-lesson.png` — same lesson as `03-` but in a 390x844
  iPhone viewport, showing the bottom action bar.
- `07-admin-overview.png` — `/admin` dashboard if your test account
  has admin enabled. Useful for showing breadth.

## Notes

- Avoid capturing real learner data. Use a dedicated demo account.
- Run `npm run dev`, set `prefers-color-scheme: dark` in the
  browser dev tools, and use the browser's built-in screenshot tool
  for sharp pixel output.
- After capture, run images through any standard PNG optimizer
  (e.g. `pngquant`) before committing — keeps the repo small.
