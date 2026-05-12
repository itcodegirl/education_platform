import { useEffect } from 'react';
import { useCourseContent } from '../providers';

export function getActiveCourseReady({
  activeCourseMeta = null,
  isActiveCourseLoaded = false,
  isCourseLoaded = () => false,
} = {}) {
  return Boolean(
    isActiveCourseLoaded ||
    (activeCourseMeta?.id && isCourseLoaded(activeCourseMeta.id)),
  );
}

export function useActiveCourseReadiness(activeCourseMeta) {
  const {
    setActiveCourseId,
    isActiveCourseLoaded,
    isCourseLoaded,
  } = useCourseContent();

  useEffect(() => {
    if (activeCourseMeta?.id) {
      setActiveCourseId(activeCourseMeta.id);
    }
  }, [activeCourseMeta?.id, setActiveCourseId]);

  return getActiveCourseReady({
    activeCourseMeta,
    isActiveCourseLoaded,
    isCourseLoaded,
  });
}
