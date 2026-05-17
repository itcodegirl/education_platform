import { useEffect, useId, useMemo, useState } from 'react';
import {
  areChallengesLoaded,
  getChallengesForCourse,
  loadChallengesForCourse,
} from '../../data/challenges';
import { getModuleProjectRecommendations } from '../../utils/moduleProjectRecommendations';

export function LessonProjectLinks({
  courseId,
  moduleId,
  moduleTitle,
  onOpenChallenge,
}) {
  const titleId = useId();
  const [challenges, setChallenges] = useState(() => getChallengesForCourse(courseId));

  useEffect(() => {
    let cancelled = false;

    setChallenges(getChallengesForCourse(courseId));

    if (areChallengesLoaded(courseId)) return undefined;

    loadChallengesForCourse(courseId)
      .then((loadedChallenges) => {
        if (!cancelled) setChallenges(loadedChallenges);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('[LessonProjectLinks] challenge load failed:', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const recommendations = useMemo(
    () => getModuleProjectRecommendations({ challenges, moduleId, limit: 2 }),
    [challenges, moduleId],
  );

  if (recommendations.length === 0) return null;

  const [primary, secondary] = recommendations;
  const handleOpenProject = () => {
    onOpenChallenge?.(primary.id);
  };

  return (
    <section className="lesson-project-links" aria-labelledby={titleId}>
      <div className="lesson-project-copy">
        <p className="lesson-project-kicker">Project match</p>
        <h2 id={titleId} className="lesson-project-title">
          Turn this module into proof
        </h2>
        <p className="lesson-project-detail">
          Best match for <strong>{moduleTitle}</strong>: {primary.title}
        </p>
        <ul className="lesson-project-proof" aria-label={`Evidence for ${primary.title}`}>
          <li>{primary.difficulty || 'practice'}</li>
          <li>{primary.evidenceLabel}</li>
        </ul>
      </div>
      <div className="lesson-project-action">
        <p>{primary.description}</p>
        {secondary && (
          <p className="lesson-project-alt">
            Also mapped here: <strong>{secondary.title}</strong>
          </p>
        )}
        {onOpenChallenge && (
          <button
            type="button"
            className="lesson-project-button"
            onClick={handleOpenProject}
            aria-label={`Open project challenge: ${primary.title}`}
          >
            Open project
          </button>
        )}
      </div>
    </section>
  );
}
