export const LESSON_PRODUCT_FRAME_FIELDS = [
  { key: 'learn', label: 'What will I learn?' },
  { key: 'matter', label: 'Why does it matter?' },
  { key: 'do', label: 'What do I do?' },
  { key: 'check', label: 'How do I know I got it?' },
  { key: 'next', label: 'What should I do next?' },
];

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function firstText(...values) {
  for (const value of values.flat()) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function firstConceptDefinition(lesson) {
  const structuredConcept = lesson?.understand?.concepts?.find((concept) =>
    cleanText(concept?.definition || concept?.meaning),
  );
  if (structuredConcept) {
    return cleanText(structuredConcept.definition || structuredConcept.meaning);
  }

  return firstText(lesson?.concepts || []);
}

function getChallengeRequirementSummary(lesson) {
  const requirements = lesson?.challenge?.requirements;
  if (!Array.isArray(requirements) || requirements.length === 0) return '';

  return `Your solution meets ${requirements.length} listed requirement${
    requirements.length === 1 ? '' : 's'
  }.`;
}

export function getLessonProductFrame(lesson, options = {}) {
  const title = cleanText(lesson?.title) || 'this lesson';
  const nextTitle = cleanText(options.nextTitle);

  return {
    learn: firstText(
      lesson?.learningFrame?.learn,
      lesson?.hook?.accomplishments?.[0],
      lesson?.summary?.capabilities?.[0],
      lesson?.concepts?.[0],
      `Build confidence with ${title}.`,
    ),
    matter: firstText(
      lesson?.learningFrame?.matter,
      lesson?.understand?.keyTakeaway,
      firstConceptDefinition(lesson),
      lesson?.output,
      `This gives you one reusable pattern you can carry into real projects.`,
    ),
    do: firstText(
      lesson?.learningFrame?.do,
      lesson?.do?.title,
      lesson?.build?.goal,
      lesson?.challenge?.mission,
      lesson?.tasks?.[0],
      `Work through the example, then practice the pattern yourself.`,
    ),
    check: firstText(
      lesson?.learningFrame?.check,
      lesson?.do?.proofRequired && `You can show ${lesson.do.proofRequired}.`,
      getChallengeRequirementSummary(lesson),
      lesson?.output && `Your preview matches the expected result: ${lesson.output}`,
      `You can explain the main idea and make a small change without guessing.`,
    ),
    next: firstText(
      lesson?.learningFrame?.next,
      lesson?.bridge?.preview,
      nextTitle && `Continue with ${nextTitle}.`,
      lesson?.challenge?.bonusChallenge,
      `Use Complete lesson to save reading progress, then take the quick check or continue forward.`,
    ),
  };
}

export function getMissingLessonProductFrameFields(frame) {
  return LESSON_PRODUCT_FRAME_FIELDS
    .filter(({ key }) => !cleanText(frame?.[key]))
    .map(({ key }) => key);
}
