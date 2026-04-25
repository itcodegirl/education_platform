# Reward and Progress Trust Policy

This policy defines the intended reward behavior for future progress-engine hardening. It is a source-of-truth foundation, not a runtime behavior migration by itself.

## Stable Reward Keys

Reward-critical actions should use stable event keys before XP is awarded:

- `lesson_complete:{lessonKey}`
- `quiz_complete:{quizKey}`
- `quiz_perfect:{quizKey}`
- `challenge_complete:{challengeId}`

These keys should be treated as idempotency keys. A learner may repeat a learning action for practice, but the same reward key should not grant XP more than once.

## XP Award Rules

- Lesson completion XP is awarded once per stable lesson key.
- Quiz completion XP is awarded once per stable quiz key.
- Quiz perfect-score bonus XP is awarded once per stable quiz key.
- Challenge completion XP is awarded once per stable challenge ID.
- Uncompleting and recompleting a lesson should not create another lesson-completion XP event.

## Quiz Retry Rules

- Learners can retry quizzes for learning.
- Retries should update the stored best score when the new score is better.
- Retries should not repeatedly grant base quiz XP.
- Perfect-score bonus XP should be awarded once, even if the learner earns perfect multiple times.

## Streak Qualifying Actions

Streaks should reflect real learning activity. Qualifying actions are:

- Completing a lesson
- Submitting a quiz
- Completing a challenge
- Other explicit learning actions that are intentionally added to the policy later

App load, navigation, and passive session activity should not count as streak activity.

## Persistence Policy

- Reward-critical actions should become idempotent in runtime code.
- Future implementation should prefer reward-event records, an equivalent stable tracking table, or a server-side atomic award operation.
- Failed reward/progress writes should be surfaced to the learner or queued for retry.
- Silent local-only success should not be shown as durable progress unless the app can retry or reconcile the write.

## Current Status

The policy constants live in `src/services/rewardPolicy.js`. Runtime XP, streak, quiz retry, and challenge persistence behavior still need follow-up implementation batches.
