import { useRef } from 'react';
import { useSR } from '../../providers';
import { COURSE_CATALOG } from '../../data/reference/course-catalog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useRemoveBookmark } from '../../hooks/useToggleBookmark';
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

function getBookmarkCourseLabel(bookmark, target) {
  if (target?.course?.label) return target.course.label;
  if (typeof bookmark.course_id === 'string' && bookmark.course_id.trim()) {
    return bookmark.course_id.trim().toUpperCase();
  }
  return 'Saved course';
}

function getBookmarkTitle(bookmark) {
  return typeof bookmark.lesson_title === 'string' && bookmark.lesson_title.trim()
    ? bookmark.lesson_title.trim()
    : 'Saved lesson';
}

export function BookmarksPanel({ isOpen, onClose, onNavigate }) {
  const { bookmarks = [] } = useSR();
  const { handleRemoveBookmark } = useRemoveBookmark();
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });
  if (!isOpen) return null;

  const handleClick = (bookmark) => {
    const target = findBookmarkTarget(bookmark, COURSE_CATALOG);
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
        aria-labelledby="bookmarks-panel-title"
        aria-describedby="bookmarks-panel-description"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Saved lessons</p>
            <h2 id="bookmarks-panel-title">Bookmarks ({bookmarks.length})</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close bookmarks">
            ×
          </button>
        </div>
        <div className="cheatsheet-body">
          <p id="bookmarks-panel-description" className="panel-meta">
            Save lessons from the lesson header star so you can jump back in quickly.
          </p>
          {bookmarks.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon" aria-hidden="true">★</span>
              <p><strong>No saved lessons yet</strong></p>
              <p className="empty-state-msg">
                Use the Save button in a lesson header when you find a page worth returning to.
                Saved lessons sync to your account when cloud sync is available.
              </p>
              <button type="button" className="empty-state-action" onClick={onClose}>
                Back to lesson
              </button>
            </div>
          ) : (
            <ul className="bookmark-list" aria-label="Saved lessons">
              {bookmarks.map((bookmark, index) => {
                const target = findBookmarkTarget(bookmark, COURSE_CATALOG);
                const moduleTitle = target?.moduleData?.title || 'Saved lesson';
                const lessonTitle = getBookmarkTitle(bookmark);
                const courseLabel = getBookmarkCourseLabel(bookmark, target);
                const coursePath = `${courseLabel} > ${moduleTitle}`;
                const isUnavailable = !target;

                // Two sibling buttons inside a list item: the primary
                // "open bookmark" action and the secondary "remove"
                // action. Nesting is avoided because HTML forbids a
                // button inside another button.
                return (
                  <li key={bookmark.id || bookmark.lesson_key || `${lessonTitle}-${index}`} className="bookmark-item">
                    <button
                      type="button"
                      className="bk-main"
                      onClick={() => handleClick(bookmark)}
                      aria-label={isUnavailable
                        ? `${lessonTitle} is unavailable in the current course catalog`
                        : `Open ${lessonTitle} (${coursePath})`}
                      disabled={isUnavailable}
                    >
                      <span className="bk-info">
                        <span className="bk-title">{lessonTitle}</span>
                        <span className="bk-path">{coursePath}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="bk-remove"
                      onClick={() => handleRemoveBookmark(bookmark)}
                      title="Remove bookmark"
                      aria-label={`Remove bookmark for ${lessonTitle}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
