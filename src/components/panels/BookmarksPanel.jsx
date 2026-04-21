import { useEffect, useRef } from 'react';
import { useSR, useCourseContent } from '../../providers';
import { COURSES } from '../../data';
import { useFocusTrap } from '../../hooks/useFocusTrap';

function parseLessonKey(lessonKey) {
  const [courseLabel = '', moduleTitle = '', lessonTitle = ''] = (lessonKey || '').split('|');
  return { courseLabel, moduleTitle, lessonTitle };
}

export function BookmarksPanel({ isOpen, onClose, onNavigate }) {
  const { bookmarks, toggleBookmark } = useSR();
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });
  // Bookmarks can point to any course. Trigger a full load so that
  // when the user clicks one, handleClick below can resolve the
  // moduleIndex + lessonIndex synchronously.
  const { ensureAllLoaded } = useCourseContent();
  useEffect(() => {
    if (isOpen) ensureAllLoaded();
  }, [isOpen, ensureAllLoaded]);
  if (!isOpen) return null;

  const handleClick = (bookmark) => {
    const courseIndex = COURSES.findIndex((course) => course.id === bookmark.course_id);
    if (courseIndex === -1) return;

    const course = COURSES[courseIndex];
    const { moduleTitle, lessonTitle } = parseLessonKey(bookmark.lesson_key);
    const moduleIndex = course.modules.findIndex((module) => module.title === moduleTitle);
    if (moduleIndex === -1) return;

    const targetLessonTitle = bookmark.lesson_title || lessonTitle;
    const lessonIndex = course.modules[moduleIndex].lessons.findIndex((lesson) => lesson.title === targetLessonTitle);
    if (lessonIndex === -1) return;

    onNavigate(courseIndex, moduleIndex, lessonIndex);
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
              const { moduleTitle } = parseLessonKey(bookmark.lesson_key);
              const coursePath = `${bookmark.course_id.toUpperCase()} > ${moduleTitle || 'Saved lesson'}`;

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
                    aria-label={`Open ${bookmark.lesson_title} (${coursePath})`}
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
