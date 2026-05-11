// useReviewQueue — owns the spaced-repetition card state for the
// active learner. Pure pass-through to the SM-2 scheduler in
// services/srAlgorithm; the persistence wire goes back through the
// caller-supplied dbWrite + createProgressWrite envelope so writes
// share the per-resource serialization map and the retry queue.
//
// Surface:
//   srCards            current cards (sorted however the loader
//                      provided them; ordering is not guaranteed)
//   addToSRQueue(c[])  append new cards, dedup on `question`
//   updateSRCard(q, c) advance an existing card's schedule on
//                      correct/incorrect review answer
//   getDueSRCards()    cards with nextReview <= now()
//   replaceCards(c[])  hydration setter for the data-load effect;
//                      replaces the whole list in one shot
//   resetCards()       clear on sign-out

import { useCallback, useEffect, useRef, useState } from 'react';
import { nextSRCardState } from '../services/srAlgorithm';

export function useReviewQueue({ user, dbWrite, createProgressWrite }) {
  const [srCards, setSrCards] = useState([]);
  // Mirror state in a ref so add/update can read the current cards
  // synchronously. Reading from the state value directly gives us
  // a stale snapshot if two calls happen in the same render batch
  // (the second sees the same value as the first); reading from a
  // setState updater is unsafe because the diff would land in a
  // closure that fires AFTER the side-effect for-loop. The ref is
  // updated in the same setState call so subsequent calls in the
  // same tick see the prior call's effect.
  const srCardsRef = useRef([]);

  useEffect(() => {
    srCardsRef.current = srCards;
  }, [srCards]);

  const replaceCards = useCallback((cards) => {
    const next = Array.isArray(cards) ? cards : [];
    srCardsRef.current = next;
    setSrCards(next);
  }, []);

  const resetCards = useCallback(() => {
    srCardsRef.current = [];
    setSrCards([]);
  }, []);

  const addToSRQueue = useCallback(async (cards) => {
    if (!user) return;
    if (!Array.isArray(cards) || cards.length === 0) return;

    const existing = new Set(srCardsRef.current.map((c) => c.question));
    const appended = cards.filter((c) => !existing.has(c.question));
    if (appended.length === 0) return;

    const next = [...srCardsRef.current, ...appended];
    srCardsRef.current = next;
    setSrCards(next);

    for (const card of appended) {
      dbWrite(createProgressWrite('addSRCard', { card }), 'addSRCard');
    }
  }, [user, dbWrite, createProgressWrite]);

  const updateSRCard = useCallback(async (question, correct) => {
    if (!user) return;

    const currentCard = srCardsRef.current.find((c) => c.question === question);
    if (!currentCard) return;

    // The SM-2-style scheduling math lives in services/srAlgorithm so
    // it stays unit-testable in isolation. This callback does state
    // + persistence only.
    const { interval, ease, nextReview } = nextSRCardState({ card: currentCard, correct });
    const updatedCard = { ...currentCard, interval, ease, nextReview };

    const next = srCardsRef.current.map((card) => (
      card.question === question ? updatedCard : card
    ));
    srCardsRef.current = next;
    setSrCards(next);

    dbWrite(
      createProgressWrite('updateSRCard', {
        question,
        updates: {
          next_review: new Date(updatedCard.nextReview).toISOString(),
          interval_days: updatedCard.interval,
          ease: updatedCard.ease,
        },
      }),
      'updateSRCard',
      { resourceKey: `sr-card:${question}` },
    );
  }, [user, dbWrite, createProgressWrite]);

  const getDueSRCards = useCallback(() => {
    const now = Date.now();
    return srCards.filter((c) => c.nextReview <= now);
  }, [srCards]);

  return {
    srCards,
    addToSRQueue,
    updateSRCard,
    getDueSRCards,
    replaceCards,
    resetCards,
  };
}
