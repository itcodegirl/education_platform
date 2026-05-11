function normalizeCompletedSet(completedIds = []) {
  if (completedIds instanceof Set) return completedIds;
  return new Set(
    (Array.isArray(completedIds) ? completedIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  );
}

function findFirstBeginnerChallenge(challenges, completedSet) {
  return challenges.find((challenge) =>
    challenge?.difficulty === 'beginner' && !completedSet.has(challenge.id),
  );
}

export function getChallengePracticePlan(challenges = [], completedIds = []) {
  const challengeList = Array.isArray(challenges) ? challenges.filter(Boolean) : [];
  const completedSet = normalizeCompletedSet(completedIds);
  const completedCount = challengeList.filter((challenge) => completedSet.has(challenge.id)).length;
  const openChallenges = challengeList.filter((challenge) => !completedSet.has(challenge.id));
  const recommendedChallenge = completedCount === 0
    ? findFirstBeginnerChallenge(challengeList, completedSet) || openChallenges[0] || null
    : openChallenges[0] || null;

  const progressLabel = `${completedCount}/${challengeList.length} complete`;
  let reason = 'All available challenges are complete. Revisit one when you want a fresh rep.';

  if (recommendedChallenge && completedCount === 0) {
    reason = 'Start here to turn lesson knowledge into a small tested build.';
  } else if (recommendedChallenge) {
    reason = 'Next open challenge in this course order. One focused build is enough for a useful practice rep.';
  }

  return {
    completedCount,
    totalCount: challengeList.length,
    openCount: openChallenges.length,
    progressLabel,
    recommendedChallenge,
    reason,
  };
}
