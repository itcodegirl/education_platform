export const COURSE_PATHWAYS = Object.freeze({
  html: Object.freeze({
    stage: 'Stage 1',
    role: 'Structure',
    outcome: 'Build readable, semantic pages that can become portfolio-ready projects.',
    evidence: 'A completed page, accessible structure, and quick checks that prove the basics are not guesswork.',
  }),
  css: Object.freeze({
    stage: 'Stage 2',
    role: 'Presentation',
    outcome: 'Turn structured pages into responsive interfaces that work on real screens.',
    evidence: 'Layout practice, responsive checks, and one visual build that can be explained.',
  }),
  js: Object.freeze({
    stage: 'Stage 3',
    role: 'Behavior',
    outcome: 'Add data, decisions, events, and persistence to make pages interactive.',
    evidence: 'Small programs, DOM practice, async patterns, and review cards for fragile concepts.',
  }),
  react: Object.freeze({
    stage: 'Stage 4',
    role: 'Product UI',
    outcome: 'Compose reusable components, state, routing, and production habits into app-quality work.',
    evidence: 'Component builds, testing signals, deployment readiness, and an applied project artifact.',
  }),
});

const DEFAULT_PATHWAY = Object.freeze({
  stage: 'Learning stage',
  role: 'Skill track',
  outcome: 'Build one useful capability at a time.',
  evidence: 'Pair lesson completion with checks, review, and applied practice.',
});

function toSafeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function getCoursePathway(courseId) {
  return COURSE_PATHWAYS[courseId] || DEFAULT_PATHWAY;
}

export function getCourseReadiness({
  courseId,
  doneLessons = 0,
  totalLessons = 0,
  isCurrent = false,
} = {}) {
  const done = toSafeCount(doneLessons);
  const total = toSafeCount(totalLessons);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done >= total;
  const pathway = getCoursePathway(courseId);

  if (isComplete) {
    return {
      pathway,
      percent,
      label: 'Complete',
      tone: 'complete',
      nextAction: 'Turn the strongest artifact from this course into portfolio evidence.',
    };
  }

  if (done === 0) {
    return {
      pathway,
      percent,
      label: isCurrent ? 'Start here' : 'Upcoming',
      tone: isCurrent ? 'current' : 'upcoming',
      nextAction: `Start with the first lesson, then add one check tied to ${pathway.role.toLowerCase()}.`,
    };
  }

  if (percent >= 80) {
    return {
      pathway,
      percent,
      label: 'Evidence due',
      tone: 'evidence',
      nextAction: 'Before rushing ahead, add a quiz pass, challenge, or review loop as proof.',
    };
  }

  return {
    pathway,
    percent,
    label: isCurrent ? 'In progress' : 'Started',
    tone: isCurrent ? 'current' : 'started',
    nextAction: 'Keep the sequence steady: lesson, quick check, review, then apply.',
  };
}
