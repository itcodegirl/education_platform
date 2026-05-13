# Curriculum Improvement Backlog

This backlog translates the completed education audit into production work.
Do not treat it as a fresh audit. Use it to plan small curriculum batches that
improve learning quality without disrupting the current app flow.

## Critical Issues

These directly affect whether learners can trust progression signals.

1. Progression must require evidence, not only lesson completion.
   - Current mitigation: module readiness now requires completed lessons, an
     80%+ quick check, applied work when available, and no due review.
   - Acceptance: progress surfaces never imply mastery from XP or reading
     completion alone.

2. Review work needs curriculum identity.
   - Current mitigation: new review cards include quiz, course, lesson/module,
     and question identity.
   - Acceptance: new due-review work can map back to a course module in learner
     summaries and future analytics.

3. Quiz feedback must teach, not merely score.
   - Next batch: add wrong-answer rationale to thin recognition-only quizzes.
   - Acceptance: each module has at least one quiz item that addresses a common
     mistake, explains why the wrong option is tempting, and links the learner
     back to a concrete review action.

## Important Improvements

These raise educational depth and long-term retention.

1. Convert rubric warnings into weekly curriculum batches.
   - Batch by course and module, not by global find-and-replace.
   - Prioritize lessons missing objective, retrieval prompt, guided practice,
     independent practice, or transfer.
   - Acceptance: each edited lesson reaches at least four of six rubric signals
     in `npm run audit:content`.

2. Strengthen applied challenges.
   - Current mitigation: challenge evidence summaries now show requirements,
     automated checks, portfolio reflection prompts, and a definition-of-done
     rubric before the learner treats the work as evidence.
   - Add or verify `recommendedModuleId` for challenges when the difficulty
     ratio is too generic.
   - Add portfolio-style requirements where the challenge currently proves only
     syntax recognition.
   - Acceptance: every completed module has one realistic build or debugging
     task that reinforces the module outcome.

3. Add cumulative checkpoints.
   - Add a small cumulative practice after natural course clusters.
   - Keep them project-shaped and practical, not high-stakes exams.
   - Acceptance: learners periodically reuse older concepts before moving into
     advanced material.

4. Improve retention loops.
   - Use review-card course/module/question metadata to show review debt by
     module.
   - Add concept tags later only after the course content has stable taxonomy.
   - Acceptance: due review is visible as targeted learning work, not a generic
     flashcard count.

## Optional Enhancements

These are useful after the core learning loop is credible.

1. Instructor curriculum health dashboard.
   - Summarize audit warnings by course, module, and signal.
   - Keep this behind admin tools or docs until the data is stable.

2. Capstone portfolio flow.
   - Add course-end projects once module-level evidence is reliable.
   - Avoid calling capstones verified credentials until backend-backed
     completion records exist.

3. Learner-facing concept map.
   - Show concepts only after each lesson has consistent concept IDs.
   - Use it to support review and navigation, not as extra gamification.

## Recommended Batch Order

1. HTML and CSS foundation modules: add retrieval prompts and misconception
   checks first.
2. JavaScript fundamentals: prioritize reasoning and debugging quiz items.
3. React modules: add transfer tasks and cumulative practice.
4. Challenge catalog: review `recommendedModuleId`, requirements, and test
   coverage against the module readiness policy.

## Definition Of Done

A curriculum improvement batch is done when:

- `npm run audit:content` warnings decrease for the edited modules.
- Lesson completion copy still separates reading progress from mastery.
- Module Evidence shows the intended readiness result for a seeded learner.
- `npm run build`, `npm run test`, `npm run lint`, and `npm run typecheck` pass.
