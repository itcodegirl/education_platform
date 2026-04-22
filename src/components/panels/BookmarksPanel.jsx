import { useEffect, useRef } from 'react';
import { useSR, useCourseContent } from '../../providers';
import { COURSES } from '../../data';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { findLessonByKey } from '../../utils/lessonKeys';

function findBookmarkTarget(bookmark, courses) {
  const byKey = findLessonByKey(bookmark.lesson_key, courses);
  if (byKey) return byKey;

  const courseIndex = courses.findIndex((course) => course.id === bookmark.course_id);
  if (courseIndex === -1) return null;
  const course = courses[courseIndex];
  if (!bookmark.lesson_title) return null;

  for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex += 1) {
    const moduleData = course.modules[moduleIndex];
    const lessonIndex = moduleData.lessons.findIndex((lesson) => lesson.title === bookmark.lesson_title);
    if (lessonIndex === -1) continue;

    return {
      course,
      moduleData,
      lesson: moduleData.lessons[lessonIndex],
      courseIndex,
      moduleIndex,
      lessonIndex,
    };
  }

  return null;
}

export function BookmarksPanel({ isOpen, onClose, onNavigate }) {
  const { bookmarks, toggleBookmark } = useSR();
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });
  // Bookmarks can point to any course. Trigger a full load so that
  // when the user clicks one, handleClick below can resolve the
  // moduleIndex + lessonIndex synchronously.
  const { ensureAllLoaded, courses = [] } = useCourseContent();
  const sourceCourses = courses.length > 0 ? courses : COURSES;
  useEffect(() => {
    if (isOpen) ensureAllLoaded();
  }, [isOpen, ensureAllLoaded]);
  if (!isOpen) return null;

  const handleClick = (bookmark) => {
    const target = findBookmarkTarget(bookmark, sourceCourses);
    if (!target) return;
    onNavigate(target.courseIndex, target.moduleIndex, target.lessonIndex);
    onClose();
  };

  return (
    <div className="search-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Bookmarks (${bookmarks.length})`}
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Saved lessons</p>
            <h2>Bookmarks ({bookmarks.length})</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close bookmarks">
            x
          </button>
        </div>
        <div className="cheatsheet-body">
          <p className="panel-meta">
            Save lessons from the lesson header star so you can jump back in quickly.
          </p>
          {bookmarks.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon" aria-hidden="true">*</span>
              <p><strong>No bookmarks yet</strong></p>
              <p className="empty-state-msg">
                Mark a lesson as saved from the header star, and it will appear here for one-click return.
              </p>
            </div>
          ) : (
            bookmarks.map((bookmark) => {
              const target = findBookmarkTarget(bookmark, sourceCourses);
              const moduleTitle = target?.moduleData?.title || 'Saved lesson';
              const courseLabel = target?.course?.label || bookmark.course_id.toUpperCase();
              const coursePath = `${courseLabel} > ${moduleTitle}`;
              const isUnavailable = !target;

              // Two sibling buttons inside a pure-layout div: the
              // primary "open bookmark" action and the secondary
              // "remove bookmark" action. Previously the whole row
              // was a <div onClick>, which meant keyboard users could
              // not activate it. Nesting isn't an option because the
              // remove button is a <button> and HTML forbids nested
              // buttons.
              return (
                <div key={bookmark.id || bookmark.lesson_key} className="bookmark-item">
                  <button
                    type="button"
                    className="bk-main"
                    onClick={() => handleClick(bookmark)}
                    aria-label={isUnavailable
                      ? `${bookmark.lesson_title} is unavailable in the current course catalog`
                      : `Open ${bookmark.lesson_title} (${coursePath})`}
                    disabled={isUnavailable}
                  >
                    <span className="bk-info">
                      <span className="bk-title">{bookmark.lesson_title}</span>
                      <span className="bk-path">{coursePath}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="bk-remove"
                    onClick={() => toggleBookmark(bookmark.lesson_key, bookmark.course_id, bookmark.lesson_title)}
                    title="Remove bookmark"
                    aria-label={`Remove bookmark for ${bookmark.lesson_title}`}
                  >
                    x
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
