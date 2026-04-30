import { describe, expect, it } from 'vitest';
import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';
import { createRewardEvent } from '../engine/rewards/rewardEvents';
import { REWARD_QUEUE_ITEM_STATUSES } from '../engine/rewards/rewardQueue';
import {
  REWARD_SYNC_ACTIONS,
  REWARD_SYNC_PLAN_STATUSES,
  buildRewardSyncPlan,
} from './rewardSyncService';

const learnerKey = 'learner-123';

function createLessonEvent(overrides = {}) {
  return createRewardEvent({
    type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
    targetId: 'lesson-01',
    learnerKey,
    createdAt: '2026-04-25T12:00:00.000Z',
    ...overrides,
  });
}

describe('rewardSyncService', () => {
  it('blocks sync planning without a learner key', () => {
    const result = buildRewardSyncPlan();

    expect(result.status).toBe(REWARD_SYNC_PLAN_STATUSES.BLOCKED);
    expect(result.reason).toBe('missing_learner_key');
  });

  it('plans backend submission for local ledger events missing from the server', () => {
    const event = createLessonEvent();

    const result = buildRewardSyncPlan({
      learnerKey,
      localLedger: {
        events: [event],
      },
      backendEvents: [],
    });

    expect(result.status).toBe(REWARD_SYNC_PLAN_STATUSES.READY);
    expect(result.actions).toEqual([{
      type: REWARD_SYNC_ACTIONS.SUBMIT_LEDGER_EVENT,
      eventKey: event.key,
      event,
    }]);
  });

  it('plans local reconciliation when the backend already has the event', () => {
    const event = createLessonEvent();

    const result = buildRewardSyncPlan({
      learnerKey,
      localLedger: {
        events: [event],
      },
      backendEvents: [{
        event_key: event.key,
      }],
    });

    expect(result.actions[0].type).toBe(REWARD_SYNC_ACTIONS.MARK_LOCAL_RECONCILED);
  });

  it('plans applied-unrecorded queue events without duplicating ledger actions', () => {
    const event = createLessonEvent();

    const result = buildRewardSyncPlan({
      learnerKey,
      localLedger: {
        events: [event],
      },
      localQueue: {
        items: [{
          event,
          status: REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
        }],
      },
    });

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe(REWARD_SYNC_ACTIONS.SUBMIT_LEDGER_EVENT);
  });

  it('plans pending queue event submission when no ledger event exists', () => {
    const event = createLessonEvent();

    const result = buildRewardSyncPlan({
      learnerKey,
      localQueue: {
        items: [{
          event,
          status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
        }],
      },
    });

    expect(result.actions).toEqual([{
      type: REWARD_SYNC_ACTIONS.SUBMIT_PENDING_QUEUE_EVENT,
      eventKey: event.key,
      event,
      queueStatus: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
    }]);
  });

  it.each([
    REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
    REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
    REWARD_QUEUE_ITEM_STATUSES.RECONCILED,
  ])('plans completed queue evidence for backend submission when the ledger is missing (%s)', (queueStatus) => {
    const event = createLessonEvent();

    const result = buildRewardSyncPlan({
      learnerKey,
      localQueue: {
        items: [{
          event,
          status: queueStatus,
        }],
      },
    });

    expect(result.actions).toEqual([{
      type: REWARD_SYNC_ACTIONS.SUBMIT_COMPLETED_QUEUE_EVENT,
      eventKey: event.key,
      event,
      queueStatus,
    }]);
  });

  it('blocks events whose learner key does not match the active learner', () => {
    const event = createLessonEvent({ learnerKey: 'someone-else' });

    const result = buildRewardSyncPlan({
      learnerKey,
      localLedger: {
        events: [event],
      },
    });

    expect(result.status).toBe(REWARD_SYNC_PLAN_STATUSES.BLOCKED);
    expect(result.conflicts).toEqual([{
      eventKey: event.key,
      reason: 'learner_key_mismatch',
    }]);
  });
});
