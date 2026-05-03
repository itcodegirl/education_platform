// ═══════════════════════════════════════════════
// useQuizSession — owns the lifecycle of a single
// quiz attempt: collecting answers, scoring on
// submit, awarding XP idempotently, queuing wrong
// MC/code/bug answers into spaced repetition.
//
// The QuizView component itself is now just an
// orchestrator that renders questions from the
// question-type registry and reads derived values
// off this hook.
// ═══════════════════════════════════════════════

import { useCallback, useState } from 'react';
import { useAuth, useProgressData, useXP, useSR } from '../providers';
import { TIMING } from '../utils/helpers';
import {
  REWARD_XP,
  formatQuizScore,
  isQuizScoreImprovement,
  quizPercent,
  rewardKeys,
} from '../services/rewardPolicy';
import { isBackendRewardSyncEnabled } from '../services/rewardEventService';
import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';
import { createRewardEvent } from '../engine/rewards/rewardEvents';
import { awardRewardOnce } from '../engine/rewards/rewardRuntime';
import { isAnswerCorrect } from '../components/learning/quiz/questionTypes';

// Build a spaced-repetition card from a wrong answer.
// fill/order don't translate to flashcards cleanly so the caller
// filters them out before getting here.
function toReviewCard(q, label) {
  return {
    question: q.question || (q.type === 'code' ? 'What does this code output?' : 'Find the bug'),
    code: q.code || (q.lines ? q.lines.join('\n') : ''),
    options: q.options || q.lines || [],
    correct: q.correct,
    explanation: q.explanation,
    source: label,
    added: Date.now(),
    nextReview: Date.now() + TIMING.dayMs,
    interval: 1,
    ease: 2.5,
  };
}

export function useQuizSession({ quiz, label, quizKey }) {
  const { user } = useAuth();
  const {
    saveQuizScore,
    quizScores = {},
    hasRewardBeenAwarded = () => false,
    markRewardAwarded = () => false,
    markSyncFailed = () => {},
  } = useProgressData();
  const { awardXP, recordDailyActivity } = useXP();
  const { addToSRQueue } = useSR();

  const [answers, setAnswers] = useState(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);

  const backendRewardSyncEnabled = Boolean(user?.id) && isBackendRewardSyncEnabled();

  const setAnswer = useCallback((qId, value) => {
    setSubmitted((isSubmitted) => {
      if (!isSubmitted) {
        setAnswers((prev) => {
          const next = new Map(prev);
          next.set(qId, value);
          return next;
        });
      }
      return isSubmitted;
    });
  }, []);

  const reset = useCallback(() => {
    setAnswers(new Map());
    setSubmitted(false);
    setLastEarnedXp(0);
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);

    const total = quiz.questions.length;
    // Defensive: a malformed quiz with zero questions would NaN out the
    // pct math below and silently fire empty reward + activity calls.
    // Mark submitted so the UI exits the answer state, then bail.
    if (total === 0) {
      setLastEarnedXp(0);
      return;
    }

    const score = quiz.questions.reduce(
      (s, q) => s + (isAnswerCorrect(q, answers.get(q.id)) ? 1 : 0),
      0,
    );
    const pct = quizPercent(score, total);

    if (quizKey && isQuizScoreImprovement(quizScores[quizKey], score, total)) {
      saveQuizScore(quizKey, formatQuizScore(score, total));
    }

    let earnedXp = 0;

    if (quizKey) {
      const completionRewardKey = rewardKeys.quizComplete(quizKey);
      const completionResult = await awardRewardOnce({
        learnerKey: user?.id || '',
        event: createRewardEvent({
          type: REWARD_EVENT_TYPES.QUIZ_BASE,
          targetId: quizKey,
          learnerKey: user?.id || 'legacy-local',
          metadata: { rewardKey: completionRewardKey, score, total, pct },
        }),
        legacyRewardKey: completionRewardKey,
        hasRewardBeenAwarded,
        markRewardAwarded,
        awardXP,
        xpAmount: REWARD_XP.quizComplete,
        reason: 'Quiz completed',
        markSyncFailed,
        backendRewardSyncEnabled,
      });
      earnedXp += completionResult.rewardResult?.xpAwarded || 0;

      if (pct === 100) {
        const perfectRewardKey = rewardKeys.quizPerfect(quizKey);
        const perfectResult = await awardRewardOnce({
          learnerKey: user?.id || '',
          event: createRewardEvent({
            type: REWARD_EVENT_TYPES.QUIZ_PERFECT,
            targetId: quizKey,
            learnerKey: user?.id || 'legacy-local',
            metadata: { rewardKey: perfectRewardKey, score, total, pct },
          }),
          legacyRewardKey: perfectRewardKey,
          hasRewardBeenAwarded,
          markRewardAwarded,
          awardXP,
          xpAmount: REWARD_XP.quizPerfect,
          reason: 'Perfect quiz score!',
          markSyncFailed,
          backendRewardSyncEnabled,
        });
        earnedXp += perfectResult.rewardResult?.xpAwarded || 0;
      }
    } else {
      // No quizKey = standalone practice quiz, no idempotency needed.
      const xpAmount = pct === 100 ? REWARD_XP.quizPerfect : REWARD_XP.quizComplete;
      awardXP(xpAmount, pct === 100 ? 'Perfect quiz score!' : 'Quiz completed');
      earnedXp = xpAmount;
    }

    setLastEarnedXp(earnedXp);
    recordDailyActivity();

    const wrongCards = quiz.questions
      .filter((q) =>
        !isAnswerCorrect(q, answers.get(q.id))
        && (q.type === 'mc' || q.type === 'code' || q.type === 'bug'),
      )
      .map((q) => toReviewCard(q, label));

    if (wrongCards.length > 0) {
      addToSRQueue(wrongCards);
    }
  }, [
    quiz,
    answers,
    quizKey,
    label,
    user?.id,
    quizScores,
    hasRewardBeenAwarded,
    markRewardAwarded,
    markSyncFailed,
    backendRewardSyncEnabled,
    awardXP,
    recordDailyActivity,
    saveQuizScore,
    addToSRQueue,
  ]);

  // Derived values — recomputed each render but cheap.
  const score = quiz.questions.reduce(
    (s, q) => s + (isAnswerCorrect(q, answers.get(q.id)) ? 1 : 0),
    0,
  );
  const total = quiz.questions.length;
  const allAnswered = total > 0 && answers.size === total;
  // quizPercent returns 0 for total <= 0, so the rendered "{pct}%" can
  // never be NaN%.
  const pct = quizPercent(score, total);
  const wrongCount = submitted ? total - score : 0;

  return {
    answers,
    submitted,
    lastEarnedXp,
    setAnswer,
    handleSubmit,
    reset,
    score,
    total,
    allAnswered,
    pct,
    wrongCount,
  };
}
