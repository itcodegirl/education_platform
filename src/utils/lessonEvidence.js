function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasStructuredChallenge(lesson = {}) {
  return Boolean(
    hasText(lesson?.challenge?.mission) ||
      hasText(lesson?.challenge?.bonusChallenge) ||
      (Array.isArray(lesson?.challenge?.requirements) && lesson.challenge.requirements.length > 0) ||
      hasText(lesson?.challenge) ||
      (Array.isArray(lesson?.tasks) && lesson.tasks.length > 0),
  );
}

function getSyncEvidenceDetail(syncStatus = {}) {
  if (syncStatus.tone === 'synced') {
    return 'Saved to the learner account when cloud sync is reachable.';
  }

  if (syncStatus.tone === 'queued') {
    return 'Saved in this browser and queued for account sync.';
  }

  if (syncStatus.tone === 'warning') {
    return 'Kept in this browser while account sync needs attention.';
  }

  if (syncStatus.tone === 'saving') {
    return 'Saving is in progress. Keep this tab open until it settles.';
  }

  return 'Saved on this device until account sync is available.';
}

export function getLessonEvidenceItems({
  lesson = {},
  isLessonDone = false,
  masteryStatus = null,
  syncStatus = null,
} = {}) {
  const challengeAvailable = hasStructuredChallenge(lesson);
  const masteryReady = masteryStatus?.isReady === true;

  return [
    {
      key: 'reading',
      label: 'Reading progress',
      state: isLessonDone ? 'Saved' : 'Not saved yet',
      tone: isLessonDone ? 'complete' : 'current',
      detail: isLessonDone
        ? getSyncEvidenceDetail(syncStatus)
        : 'Use Complete lesson after you read and try the build. This records reading progress, not mastery.',
    },
    {
      key: 'recall',
      label: 'Recall evidence',
      state: masteryReady ? 'Ready' : 'Needs proof',
      tone: masteryReady ? 'complete' : 'attention',
      detail: masteryStatus?.detail ||
        'Use a quick check, explanation, or notes to prove the idea stuck.',
    },
    {
      key: 'application',
      label: 'Application proof',
      state: challengeAvailable ? 'Available' : 'Use the build',
      tone: challengeAvailable ? 'current' : 'neutral',
      detail: challengeAvailable
        ? 'Finish the challenge or requirements to show you can use this skill in code.'
        : 'Make one small change to the lesson build and explain why it works.',
    },
  ];
}

export function getLessonEvidenceSummary({ isLessonDone = false, masteryStatus = null } = {}) {
  if (!isLessonDone) {
    return 'Start with the lesson and build. Completion saves reading progress only.';
  }

  if (masteryStatus?.isReady === true) {
    return 'Reading is saved and recall evidence is strong enough to continue.';
  }

  return 'Reading is saved. Add recall or application evidence before moving too far ahead.';
}
