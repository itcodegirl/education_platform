# Reviewer Evidence Map

This map turns the CodeHerWay portfolio story into concrete evidence. Use it when a reviewer asks, "Where can I see that in the code?"

## Product Trust Claims

| Claim | Evidence to inspect | Validation signal |
| --- | --- | --- |
| The app is honest about portfolio/demo readiness, not production readiness. | `README.md`, `KNOWN_LIMITATIONS.md`, `docs/trust-boundaries.md`, `docs/repair-roadmap.md` | Documentation consistently separates demo readiness from production launch gates. |
| Progress Summary is not presented as a verified certificate. | `src/components/gamification/CourseComplete.jsx`, `docs/reward-backfill-strategy.md`, `KNOWN_LIMITATIONS.md` | Unit coverage in `src/components/gamification/CourseComplete.test.jsx`. |
| Lesson completion means saved reading progress, while quizzes and challenges stay separate checks. | `src/utils/lessonCompletionCopy.js`, `src/components/learning/QuizView.jsx`, `docs/reviewer-start-here.md` | Unit/component tests around lesson completion and quiz reward behavior. |
| Lesson progress is tied to a clear learning contract, not just completion clicks. | `src/components/learning/LessonEvidencePanel.jsx`, `src/utils/lessonEvidence.js`, `src/styles/lessons.css` | `src/utils/lessonEvidence.test.js` and `src/components/learning/LessonEvidencePanel.test.jsx` cover prerequisite, outcome, practice, recall, and proof guidance. |
| Readiness language stays consistent across lesson, roadmap, and progress surfaces. | `src/utils/learnerReadiness.js`, `src/components/panels/RoadmapPanel.jsx`, `src/utils/lessonMasteryStatus.js`, `src/utils/progressDashboard.js` | Unit coverage in `src/utils/learnerReadiness.test.js`, `src/components/panels/RoadmapPanel.test.jsx`, `src/utils/lessonMasteryStatus.test.js`, and `src/utils/progressDashboard.test.js`. |
| Cross-device reward trust is not overclaimed. | `docs/reward-sync-strategy.md`, `docs/backend-reward-events.md`, `docs/staging-supabase-validation.md` | Backend reward sync remains feature-gated and staging validation is required. |
| Portfolio screenshots have a stable proof checklist instead of ad hoc captures. | `docs/screenshots/README.md`, `scripts/check-screenshot-guide.mjs` | `npm run audit:screenshot-guide` verifies required captures, privacy guidance, mobile viewport guidance, learning-contract proof, and progress-summary trust copy. |

## Architecture And Reliability Claims

| Claim | Evidence to inspect | Validation signal |
| --- | --- | --- |
| The app has one clear router architecture for reviewers to follow. | `src/routes/appRouter.jsx`, `src/routes/routePaths.js`, `src/routes/routeUtils.js` | Route tests in `src/routes/` and public Playwright smoke coverage. |
| Stale lesson links recover to a useful course entry point instead of dumping learners at the homepage. | `src/routes/appRouter.jsx`, `src/routes/appRouter.test.jsx`, `tests/e2e/public-learning-entry.spec.js` | Unit coverage for unknown module recovery plus public smoke coverage for stale lesson URLs. |
| Learner state uses stable IDs where available and keeps legacy compatibility. | `src/utils/lessonKeys.js`, `src/utils/savedPosition.js`, `src/context/ProgressContext.jsx` | Focused unit tests in `src/utils/lessonKeys.test.js` and `src/utils/savedPosition.test.js`. |
| Failed covered progress writes can retry in the same browser. | `src/services/progressWriteQueue.js`, `src/hooks/useProgressSync.js`, `docs/progress-sync-recovery.md` | Queue/replay tests in `src/services/progressWriteQueue.test.js` and `src/hooks/useProgressSync.test.jsx`. |
| Reward awards are idempotent locally and prepared for backend authority. | `src/engine/rewards/`, `src/services/rewardEventService.js`, `supabase/migrations/` | Reward runtime/service tests plus Supabase policy static checks. |
| Saved lesson panels tolerate older or partial bookmark records without crashing the learner shell. | `src/components/panels/BookmarksPanel.jsx`, `src/components/panels/BookmarksPanel.test.jsx` | Component coverage renders incomplete legacy bookmarks as disabled, understandable saved-lesson rows. |
| Bundle growth is watched instead of ignored. | `vite.config.js`, `scripts/check-bundle-size.mjs`, `docs/pr-admin-readiness.md` | `npm run check:bundle` runs inside the broader quality gate. |
| Lighthouse claims have an evidence path instead of living as an unsupported performance claim. | `docs/lighthouse-evidence.md`, `scripts/check-lighthouse-evidence.mjs`, `.github/workflows/lighthouse-ci.yml`, `lighthouserc.json` | `npm run audit:lighthouse-evidence` verifies the evidence doc and CI uploads `.lighthouseci/` reports. |

## Accessibility And UX Claims

| Claim | Evidence to inspect | Validation signal |
| --- | --- | --- |
| Keyboard users can bypass navigation and reach the main lesson content. | `src/layouts/AppLayout.jsx`, `src/styles/base.css` | Playwright skip-link coverage in `tests/e2e/lesson-flow.spec.js`. |
| Dialogs and overlays are built with explicit focus management. | `src/hooks/useFocusTrap.js`, `src/components/panels/`, `src/components/shared/` | Component tests and `npm run test:a11y:unit`. |
| Mobile navigation reduces clutter before a learner has progress. | `src/constants/learningTools.js`, `src/components/layout/BottomToolbar.jsx`, `src/components/layout/MobileToolsSheet.jsx` | Unit tests for tool availability and mobile sheet behavior. |
| Public mobile viewports are covered at phone and tablet widths. | `scripts/run-public-playwright.mjs`, `tests/e2e/public-learning-entry.spec.js`, `tests/e2e/public.visual.spec.js`, `docs/mobile-qa-checklist.md` | `npm run test:e2e:smoke:public` and `npm run test:e2e:visual:public` cover 320, 360, 390, 430, and 768 widths without requiring authenticated credentials. |
| Quiz retry and ordering behavior is clearer and less misleading. | `src/hooks/useQuizSession.js`, `src/components/learning/QuizView.jsx`, `src/components/learning/quiz/questionTypes.jsx` | Quiz session and QuizView tests. |

## Verification Commands

Run the same baseline used for this repository's reviewed changes:

```bash
npm run build
npm run test
npm run lint
npm run typecheck
npm run test:e2e:smoke:public
npm run test:e2e:visual:public
```

`npm run typecheck` is intentionally a JS-only source-policy check in this HTML/CSS/JavaScript/React project.
