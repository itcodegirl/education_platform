const DEFAULT_REFLECTION_PROMPTS = Object.freeze([
  'What did you build, and what problem does it solve?',
  'Which requirement was hardest to satisfy?',
  'What would you improve before showing this in a portfolio?',
]);

function normalizeTextList(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeTestLabels(tests = []) {
  if (!Array.isArray(tests)) return [];
  return tests
    .map((test) => String(test?.label || '').trim())
    .filter(Boolean);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getChallengeEvidenceSummary(challenge, { isCompleted = false } = {}) {
  const requirements = normalizeTextList(challenge?.requirements);
  const testLabels = normalizeTestLabels(challenge?.tests);
  const difficulty = String(challenge?.difficulty || '').trim();
  const capabilityItems = requirements.length > 0
    ? requirements.slice(0, 4)
    : testLabels.slice(0, 4);

  return {
    isCompleted,
    statusLabel: isCompleted ? 'Evidence ready' : 'Evidence in progress',
    statusDetail: isCompleted
      ? 'Saved as same-browser CodeHerWay progress. Use it as a practice note, not a verified credential.'
      : 'Pass every check to turn this challenge into a credible practice note.',
    proofItems: [
      pluralize(requirements.length, 'requirement'),
      pluralize(testLabels.length, 'automated check'),
      difficulty ? `${difficulty} practice` : 'practice challenge',
    ],
    capabilityItems,
    testLabels,
    reflectionPrompts: DEFAULT_REFLECTION_PROMPTS,
  };
}
