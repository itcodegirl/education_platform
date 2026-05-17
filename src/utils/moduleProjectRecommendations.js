function normalizeId(value) {
  return String(value || '').trim();
}

function countItems(items) {
  return Array.isArray(items) ? items.length : 0;
}

export function getProjectEvidenceLabel(challenge) {
  const requirementCount = countItems(challenge?.requirements);
  const testCount = countItems(challenge?.tests);

  if (requirementCount > 0 && testCount > 0) {
    return `${requirementCount} requirement${requirementCount === 1 ? '' : 's'} / ${testCount} check${testCount === 1 ? '' : 's'}`;
  }

  if (requirementCount > 0) {
    return `${requirementCount} requirement${requirementCount === 1 ? '' : 's'}`;
  }

  if (testCount > 0) {
    return `${testCount} check${testCount === 1 ? '' : 's'}`;
  }

  return 'Practice evidence';
}

export function getModuleProjectRecommendations({
  challenges = [],
  moduleId = '',
  limit = 2,
} = {}) {
  const targetModuleId = normalizeId(moduleId);
  if (!targetModuleId) return [];

  return (Array.isArray(challenges) ? challenges : [])
    .filter((challenge) => normalizeId(challenge?.recommendedModuleId) === targetModuleId)
    .slice(0, limit)
    .map((challenge) => ({
      ...challenge,
      evidenceLabel: getProjectEvidenceLabel(challenge),
    }));
}
