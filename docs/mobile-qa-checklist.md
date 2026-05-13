# Mobile QA Checklist

Use this checklist after changes that touch lessons, panels, onboarding, progress, tools, quizzes, challenges, or shell layout. It turns the audit findings into repeatable acceptance criteria without requiring a new audit.

## Viewports

Run the flow at these widths before release or PR merge:

- 320 x 568: smallest supported phone pressure test.
- 360 x 780: common Android narrow viewport.
- 390 x 844: common iPhone viewport.
- 430 x 932: large phone viewport.
- 768 x 1024: tablet portrait.

## Core Learner Flow

1. Open the first lesson.
2. Confirm the topbar, lesson focus strip, starter guide, and lesson title are visible without overlap.
3. Open the course drawer, switch a module, then close it with the close button and Escape.
4. Open Tools, then open Search, Saved lessons, Progress, Glossary, and Cheat sheets.
5. Complete a lesson and confirm the next action stays obvious.
6. Open Progress and confirm the snapshot separates lessons saved, current state, and review due.
7. Open Roadmap and confirm module states use learner readiness language instead of vague progress labels.
8. Take a quick check and confirm answer feedback does not push controls off-screen.

## Touch Targets

Every reachable mobile control should have a 44 x 44 CSS px hit area or larger:

- Topbar menu and search.
- Sidebar close, course tabs, module rows, and lesson rows.
- Lesson bookmark and notes controls.
- Bottom lesson nav controls.
- Mobile tool sheet options.
- Modal close buttons.
- Quiz answers, submit, and retry.
- Challenge run, reset, explain, and AI controls.

## Keyboard And Focus

- Opening any drawer, modal, or sheet moves focus inside it.
- Tab order stays inside blocking overlays.
- Escape closes blocking overlays.
- Focus returns to the opener when the overlay closes.
- Focusing notes, search, SR inputs, or AI inputs does not hide the active field behind the keyboard.
- The bottom lesson nav hides or reflows without causing the active input to jump off-screen.

## Layout And Readability

- No text overlaps, truncates awkwardly, or spills outside buttons.
- Lesson prose stays readable and does not exceed the viewport width.
- Code blocks scroll horizontally only when needed and have enough vertical room to inspect.
- The mobile tools sheet leaves enough surrounding context to understand where the learner is.
- The progress snapshot stacks to one column on narrow phones.

## Trust And Learning Copy

- Completion copy says it saves reading progress.
- Mastery copy points to quick checks, review, and challenges.
- Roadmap copy uses `Reading in progress`, `Evidence needed`, `Ready to continue`, and `Not started` consistently.
- Sync copy never implies cloud persistence when the app is local or queued.
- XP, badges, and streaks read as motivation, not proof of mastery.

## Commands

Use the automated gates first:

```bash
npm run build
npm run test
npm run lint
npm run typecheck
npm run test:e2e:smoke:public
npm run test:e2e:visual:public
```

Use mobile E2E when authenticated credentials are available:

```bash
npm run test:e2e:smoke:mobile
```

Use public mobile visual coverage when authenticated credentials are not available. The public scripts start and stop their own Vite server:

```bash
npm run test:e2e:smoke:public
npm run test:e2e:visual:public
```

If credentials are not available, record that the authenticated mobile path was not executed and keep the manual viewport checklist above as the release fallback.
