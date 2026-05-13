const DEFAULT_REFLECTION_PROMPTS = Object.freeze([
  'What did you build, and what problem does it solve?',
  'Which requirement was hardest to satisfy?',
  'What would you improve before showing this in a portfolio?',
]);

const DEFAULT_RUBRIC_ITEMS = Object.freeze([
  'Every visible requirement is represented in the code.',
  'Automated checks pass without changing the grader.',
  'You can explain one code decision and one improvement.',
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
  const challengeRubric = normalizeTextList(challenge?.rubric || challenge?.definitionOfDone);
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
    rubricItems: challengeRubric.length > 0 ? challengeRubric : DEFAULT_RUBRIC_ITEMS,
    reflectionPrompts: DEFAULT_REFLECTION_PROMPTS,
  };
}
