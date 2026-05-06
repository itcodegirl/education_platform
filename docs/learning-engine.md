# Learning Engine Map

A reference for reviewers and contributors that traces, end-to-end, how a
learner action turns into stored state, XP, streaks, and badges. Intended
as the entry point before any engine-touching change.

The companion documents go deeper on individual layers:

- `docs/reward-progress-policy.md` — the reward + persistence policy contract
- `docs/reward-engine-diagnostics.md` — local diagnostic surface
- `docs/reward-sync-strategy.md` — the unified local + backend sync model
- `docs/progress-sync-recovery.md` — same-device retry/replay queue
- `docs/atomic-reward-award.md` — the optional Supabase atomic RPC

This file is the map; those are the chapters.

## 1. Data shape

Course content lives in `src/data/`. Each course is loaded lazily by
`CourseContentProvider`:

```
COURSES = [
  {
    id: 'html' | 'css' | 'js' | 'react',  // stable course id
    label: 'HTML' | 'CSS' | 'JS' | 'React',
    icon: string, accent: string,         // metadata
    modules: [
      {
        id: string,                       // stable module id
        title: string, emoji: string,
        lessons: [
          {
            id: string,                   // stable lesson id
            title: string, content: string, code?: string,
            // structured-lesson optional fields:
            hook?, do?, understand?, build?, challenge?, summary?, bridge?,
            // legacy-lesson optional fields:
            concepts?: string[], tasks?: string[],
            metadata?: { estimatedTime?, difficulty? },
          }
        ]
      }
    ]
  }
]

QUIZ_MAP = Map<scopedKey, quiz>
  scopedKey = `l:${courseId}:${lessonId}`  // per-lesson quiz
            | `m:${courseId}:${moduleId}`  // module-end quiz

CHALLENGES = [{ id, title, description, starter, tests, ... }]  // per course
```

`COURSES` and `QUIZ_MAP` are mutable containers — they start empty (metadata
only) and `CourseContentProvider` populates them as courses are loaded.
Components should read through `useCourseContent()` so React re-renders
when new modules arrive.

## 2. Lesson keys

Lesson identity in stored progress uses two formats:

- **Stable**: `c:${courseId}|m:${moduleId}|l:${lessonId}` — preferred
- **Legacy**: `${courseLabel}|${moduleTitle}|${lessonTitle}` — only present
  for older completions persisted before the stable format

`src/utils/lessonKeys.js` is the single owner of:

- `getLessonKeyVariants` — returns both forms for a given lesson
- `hasLessonCompletion` — checks completedSet for either variant
- `resolveStableLessonKey` / `resolveStableLessonKeyAcrossCourses` —
  promotes a legacy key to a stable key when possible
- `lessonKeysEquivalent` — normalizes both sides before comparing

Anything reading `completed` should go through these helpers, not raw
string comparison.

## 3. Lesson completion

```
User clicks "Mark done"
       │
       ▼
useMarkLessonDone (hook)
   ├─ marking guard prevents rapid double-fire
   ├─ resolveLessonToggle picks stable-then-legacy key
   ├─ optimistic toggle: learn.toggleLessonDone(key, { skipRemote })
   └─ react-router useFetcher: POST /learn/.../action with intent=toggle-progress
       │
       ▼
useLearning → createLearningEngine.toggleLessonDone
   ├─ if not done: completeLesson
   │   ├─ toggleLesson(key)        → ProgressContext.setCompleted
   │   └─ runRewardInBackground    → awardRewardOnce(LESSON_COMPLETE, …)
   │       ├─ legacy reward dedup (rewardHistoryRef.has)
   │       ├─ local reward-event ledger dedup (per-learner)
   │       ├─ optional backend sync (feature-flagged)
   │       ├─ awardXP(25, 'Lesson completed')
   │       └─ onRewardApplied → recordDailyActivity → bumps streak/dailyCount
   └─ if already done: uncompleteLesson
       └─ toggleLesson(key) only — no XP, no streak change
```

Idempotency guarantees:

- `markRewardAwarded(legacyKey)` returns false on duplicate
- `awardRewardOnce` short-circuits on legacy or learner-scoped dedup
- Uncompleting + recompleting the same lesson does NOT re-award XP because
  the legacy reward key persists in `rewardHistoryRef`

## 4. Quiz completion

The quiz flow is owned by `useQuizSession` (hook), NOT by
`learningEngine.submitQuiz`. The engine factory ships an equivalent
reference implementation, but the runtime path is the hook.

```
User clicks "Submit quiz"
       │
       ▼
useQuizSession.handleSubmit
   ├─ score = sum of correct answers
   ├─ pct = round((score / total) * 100), guarded against total=0
   ├─ if score is an improvement → saveQuizScore(quizKey, "score/total")
   ├─ awardRewardOnce(QUIZ_BASE, …)
   │   └─ may awardXP(40, 'Quiz completed') the first time
   ├─ if pct === 100: awardRewardOnce(QUIZ_PERFECT, …)
   │   └─ may awardXP(60, 'Perfect quiz score!') the first time
   ├─ recordDailyActivity()        ← policy: every submit qualifies
   └─ wrong MC/code/bug answers → addToSRQueue (spaced repetition)
```

Per `docs/reward-progress-policy.md`:

- Retries are allowed.
- Best score is updated only on improvement (`isQuizScoreImprovement`).
- Base XP is awarded once per stable quiz key.
- Perfect XP is awarded once per stable quiz key.
- Submitting a quiz is a streak-qualifying action — including retries —
  so `recordDailyActivity` runs unconditionally on submit. This is
  intentional engagement design, documented in the policy.

## 5. Challenge completion

```
User passes all challenge tests in iframe
       │
       ▼
useChallengeSession.runTests
   └─ if allPassed && !already-fired → onComplete()
       │
       ▼
ChallengesPanel.onComplete →
       │
       ▼
useLearning → createLearningEngine.completeChallenge
   ├─ if isChallengeCompleted(id) → no-op, returns alreadyCompleted: true
   └─ markChallengeCompleted(id) (writes to localStorage)
       └─ awardRewardOnce(CHALLENGE_COMPLETE, …)
           ├─ awardXP(25, 'Challenge completed') the first time
           └─ recordDailyActivity()
```

Idempotency guarantees:

- `useChallengeSession.passed` flag prevents double-firing within a session
- `isChallengeCompleted(id)` early-returns if already in the persisted set
- `markChallengeCompleted(id)` returns false if already in the set, so
  the reward block doesn't run twice

## 6. XP, streaks, daily goal, badges

`recordDailyActivity` (in `ProgressContext`) is the single owner of:

- `dailyCount` — number of qualifying actions today, capped at `DAILY_GOAL`
- `streak` / `streakLastDate` — incremented when `lastDate !== today`
  - `+1` if `lastDate === yesterday`, else reset to `1`
- Persists both via `dbWrite('updateStreak')` and `dbWrite('updateDailyGoal')`

Display guards (in `src/utils/helpers.js`):

- `getActiveStreakDays(streak, lastDate, today, yesterday)` — returns 0
  when last activity is older than yesterday so the topbar can't lie
- `getPausedStreak(...)` — returns the lapsed streak as a recovery hint
- `getActiveDailyCount(dailyCount, dailyDate, today)` — returns 0 when
  `dailyDate !== today`

Badge eligibility lives in `src/services/badgeRules.js` (pure). The
provider's `checkBadges` runs after every progress change and enqueues
freshly-earned badges into `newBadgeQueue` so the BadgeUnlock celebration
plays one at a time even when several badges land in the same action.

## 7. Persistence layers

| Surface                        | Local                                | Backend                 | Recovery                          |
| ------------------------------ | ------------------------------------ | ----------------------- | --------------------------------- |
| Lesson completion              | `setCompleted` (React state)         | `progress` table        | `progressWriteQueue` retry        |
| Quiz score                     | `setQuizScores` (React state)        | `quiz_scores` table     | `progressWriteQueue` retry        |
| XP total                       | `setXpTotal`                         | `xp` table              | `progressWriteQueue` retry        |
| Streak / daily goal            | `setStreak` / `setDailyCount`        | `streak`/`daily` tables | `progressWriteQueue` retry        |
| Badges earned                  | `setEarnedBadges`                    | `badges` table          | `progressWriteQueue` retry        |
| SR cards                       | `setSrCards`                         | `sr_cards` table        | `progressWriteQueue` retry        |
| Bookmarks / notes              | React state                          | `bookmarks`/`notes`     | `progressWriteQueue` retry        |
| Last position                  | React state                          | `position` table        | `progressWriteQueue` retry        |
| Reward history (legacy keys)   | localStorage `chw-reward-history-*`  | (backend reward events) | rebuilt on load from progress     |
| Challenge completions          | localStorage `chw-challenges-done-*` | not yet                 | rebuilt on load from localStorage |
| Reward event ledger            | localStorage (per learner)           | `reward_events` table   | replay queue + reconciliation     |
| Per-lesson task checks         | localStorage `chw-tasks`             | not synced              | local-only, by design             |
| Per-lesson notes (UI textarea) | React state + Supabase `notes`       | Supabase                | dbWrite                           |

The optimistic state in React is always the source of truth for the
session. `dbWrite` runs async and queues failures into
`progressWriteQueue`; the queue replays on online/visibilitychange and on
the next session start.

## 8. Reward event types — two namespaces

Two `REWARD_EVENT_TYPES` constants exist intentionally:

- `src/services/rewardPolicy.js` — **lowercase**, e.g. `'lesson_complete'`.
  Used to derive **legacy reward keys** like `lesson_complete:html|...`.
  These keys live in `rewardHistoryRef` and dedupe XP for same-device
  uncomplete/recomplete flows.
- `src/engine/rewards/rewardEventTypes.js` — **uppercase**, e.g.
  `'LESSON_COMPLETE'`. Used to type the **runtime reward event** records
  that flow through the local ledger and (optionally) the backend
  `award_reward_event` RPC.

Both sets cover the same four conceptual events (lesson, quiz base, quiz
perfect, challenge), but they exist in different vocabularies because
they front different storage shapes. A future refactor could collapse
them, but doing so requires migrating the legacy reward-key strings
already persisted in learner localStorage — out of scope for now.

## 9. Backend boundaries

Currently persisted to Supabase:

- All `progress`, `quiz_scores`, `xp`, `streak`, `daily`, `badges`,
  `sr_cards`, `bookmarks`, `notes`, `position`, `courses_visited`.

Local-only with a path forward:

- **Reward history (legacy keys)** — local; rebuilt from progress on load
- **Challenge completions** — localStorage only; no backend table yet
- **Reward event ledger** — local by default; backend mirroring is gated
  by `VITE_REWARD_BACKEND_SYNC_ENABLED=true` and only safe after the
  `reward_events` migrations have been applied

Local-only by design (not migration candidates):

- Per-lesson task checks (localStorage `chw-tasks`)
- Sidebar collapse, theme, lock mode, install dismiss seen, what's new seen
- Reward retry queue intermediate state

## 10. Known engine risks

- **Quiz retries qualify for streak/dailyCount per policy.** A learner
  could in principle re-submit a quiz with garbage answers to fake the
  daily-goal badge. Documented intent, but worth surfacing if the
  engagement ROI is ever revisited.
- **`recordDailyActivity` reads stale React state when called twice in
  the same batch.** Hardened with functional-updater state writes (see
  the test in `ProgressContext.test.jsx`).
- **`Math.round((score / total) * 100)` NaNs if `total === 0`.** Guarded
  in `useQuizSession` and `learningEngine.submitQuiz`; an empty quiz
  early-returns without firing rewards.
- **Cross-device reward dedup is local-first.** Two devices that go
  offline, complete the same lesson, and reconnect will each award XP
  locally; the backend ledger is the eventual reconciliation target. Until
  the backend reward sync is enabled and migrated, treat XP as
  per-device.
- **Challenge completions are localStorage-only.** A learner who clears
  storage loses their challenge history, including dedup state.

## 11. Where to start when changing the engine

- Reward policy → `src/services/rewardPolicy.js` (single source of truth
  for XP amounts, reward keys, retry rules).
- Lesson/quiz/challenge orchestration →
  `src/services/learningEngine.js` (lesson + challenge runtime path) and
  `src/hooks/useQuizSession.js` (quiz runtime path).
- Persistence → `src/context/ProgressContext.jsx` for state owners,
  `src/services/progressService.js` for Supabase calls,
  `src/services/progressWriteQueue.js` for retry/replay.
- Reward dedup runtime → `src/engine/rewards/rewardRuntime.js`.
- Badge rules → `src/services/badgeRules.js`.
- Display-only guards → `src/utils/helpers.js`
  (`getActiveStreakDays`, `getActiveDailyCount`, `getPausedStreak`).
