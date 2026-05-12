# Screenshot Capture Guide

This directory is reserved for recruiter-facing portfolio screenshots. Keep the filenames below exact so `README.md`, the reviewer demo script, and portfolio materials can point to stable assets.

Recommended desktop capture size: 1600x900 or 1920x1080. Recommended mobile capture size: 390x844 or 430x932. Use a dedicated demo account, avoid real learner data, and crop browser chrome so the product is the visual subject.

## Required Capture Set

### `01-landing-auth.png`

The unauthenticated landing page at `/`.

State to set up:
- Sign out, then load the root URL.
- Wait for the hero copy and primary CTAs to render.
- Capture the first viewport with enough next-section context to show this is a real product entry, not only a splash screen.

What this proves:
- Brand identity, hierarchy, first action clarity, and public trust posture.

### `02-first-lesson-preview.png`

The first lesson or first-lesson preview for a learner with no completed progress.

State to set up:
- Use a fresh demo learner or the public preview path.
- Open the default HTML learning path.
- Keep the first-session guidance visible if the signed-in flow is used.

What this proves:
- Beginner-friendly onboarding, calm pacing, and the main learning surface.

### `03-lesson-learning-contract.png`

A lesson view with the learning evidence panel visible.

State to set up:
- Open a structured lesson.
- Ensure the panel section showing prerequisite, outcome, guided practice, recall check, and proof/transfer is visible.
- Keep enough surrounding lesson content in frame to show the contract belongs to the lesson, not a separate dashboard.

What this proves:
- Educational structure, proof-oriented lesson design, and progress semantics beyond completion clicks.

### `04-progress-evidence.png`

The progress or profile evidence surface with at least one completed lesson and one proof signal.

State to set up:
- Complete one or two lessons in a demo account.
- Add at least one quiz/review/challenge signal if available.
- Open the Progress panel or `/profile` and capture the evidence/transcript area.

What this proves:
- Honest separation between reading progress, XP motivation, recall checks, application proof, and review health.

### `05-mobile-learning.png`

The learner experience in a mobile viewport.

State to set up:
- Use a 390x844 or 430x932 viewport.
- Open a lesson with the mobile navigation/tool surface visible.
- Prefer the same lesson used in `03-lesson-learning-contract.png` for easy comparison.

What this proves:
- Mobile-first usability, constrained labels, reachable navigation, and touch-friendly learning flow.

### `06-progress-summary-trust.png`

The Progress Summary or export-adjacent trust boundary.

State to set up:
- Use a demo learner with visible progress.
- Open the Progress Summary surface.
- Capture the copy that makes clear this is a learning record, not a verified credential.

What this proves:
- Product honesty, reward trust boundaries, and portfolio/demo posture.

## Optional Capture

### `07-admin-overview.png`

The admin dashboard if the demo account has admin access.

What this proves:
- Product breadth and internal tooling, only if the state is polished and access is intentionally enabled.

## Capture Rules

- Do not capture real learner names, emails, notes, or private progress.
- Use a dedicated demo account and reset it between portfolio refreshes.
- Keep dark theme unless a screenshot is specifically documenting light-theme parity.
- Optimize PNGs before committing so the repository stays small.
- Do not commit partial local Lighthouse output; `.lighthouseci/` is ignored and CI artifacts are referenced from `docs/lighthouse-evidence.md`.
