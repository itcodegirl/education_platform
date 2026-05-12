function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getFirstText(values = []) {
  return values.find((value) => hasText(value))?.trim() || '';
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
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

function getPrerequisiteDetail(lesson = {}) {
  if (Array.isArray(lesson.prereqs)) {
    if (lesson.prereqs.length === 0) {
      return 'No prerequisite lesson is required. This is a safe starting point.';
    }

    return `${pluralize(lesson.prereqs.length, 'prerequisite lesson')} expected. Review first if this feels shaky.`;
  }

  return 'Use the previous lesson or module recap if this concept feels unfamiliar.';
}

function getOutcomeDetail(lesson = {}) {
  return getFirstText([
    ...(Array.isArray(lesson.hook?.accomplishments) ? lesson.hook.accomplishments : []),
    lesson.build?.goal,
    ...(Array.isArray(lesson.summary?.capabilities) ? lesson.summary.capabilities : []),
    lesson.title && `Complete ${lesson.title} and explain what changed.`,
  ]);
}

function getPracticeDetail(lesson = {}) {
  if (Array.isArray(lesson.do?.steps) && lesson.do.steps.length > 0) {
    return `Work through ${pluralize(lesson.do.steps.length, 'guided step')} before marking reading complete.`;
  }

  if (Array.isArray(lesson.tasks) && lesson.tasks.length > 0) {
    return `Use ${pluralize(lesson.tasks.length, 'practice task')} to turn the concept into code.`;
  }

  if (hasText(lesson.code) || hasText(lesson.do?.code)) {
    return 'Run or rewrite the starter code so the idea becomes visible.';
  }

  return 'Read the lesson, then make one small change before moving on.';
}

function getRecallDetail(lesson = {}) {
  const concepts = Array.isArray(lesson.understand?.concepts)
    ? lesson.understand.concepts
    : lesson.concepts;
  const firstConceptName = Array.isArray(concepts)
    ? concepts.find((concept) => hasText(concept?.name) || hasText(concept))?.name || concepts.find(hasText)
    : '';

  if (hasText(firstConceptName)) {
    return `Explain ${firstConceptName} in your own words before continuing.`;
  }

  if (hasText(lesson.understand?.keyTakeaway)) {
    return lesson.understand.keyTakeaway;
  }

  return 'Write one sentence about why the solution works.';
}

function getProofDetail(lesson = {}) {
  return getFirstText([
    lesson.do?.proofRequired,
    lesson.challenge?.mission,
    Array.isArray(lesson.challenge?.requirements) && lesson.challenge.requirements.length > 0
      ? `Complete ${pluralize(lesson.challenge.requirements.length, 'challenge requirement')}.`
      : '',
    hasText(lesson.challenge) ? lesson.challenge : '',
    'Save one working change, challenge attempt, or note as proof.',
  ]);
}

export function getLessonLearningContract({ lesson = {} } = {}) {
  return [
    {
      key: 'prerequisite',
      label: 'Prerequisite',
      detail: getPrerequisiteDetail(lesson),
    },
    {
      key: 'outcome',
      label: 'Outcome',
      detail: getOutcomeDetail(lesson),
    },
    {
      key: 'practice',
      label: 'Guided practice',
      detail: getPracticeDetail(lesson),
    },
    {
      key: 'recall',
      label: 'Recall check',
      detail: getRecallDetail(lesson),
    },
    {
      key: 'proof',
      label: 'Proof / transfer',
      detail: getProofDetail(lesson),
    },
  ];
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
