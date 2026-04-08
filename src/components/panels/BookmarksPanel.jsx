import { useProgress } from '../../providers';
import { COURSES } from '../../data';

function parseLessonKey(lessonKey) {
  const [courseLabel = '', moduleTitle = '', lessonTitle = ''] = (lessonKey || '').split('|');
  return { courseLabel, moduleTitle, lessonTitle };
}

export function BookmarksPanel({ isOpen, onClose, onNavigate }) {
  const { bookmarks, toggleBookmark } = useProgress();
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
      <div className="search-modal">
        <div className="cheatsheet-head">
          <h2>Bookmarks ({bookmarks.length})</h2>
          <button type="button" className="cheatsheet-close" onClick={onClose}>x</button>
        </div>
        <div className="cheatsheet-body">
          {bookmarks.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon">+</span>
              <p><strong>No bookmarks yet</strong></p>
              <p className="empty-state-msg">
                Click the bookmark icon on any lesson to save it here.
              </p>
            </div>
          ) : (
            bookmarks.map((bookmark) => {
              const { moduleTitle } = parseLessonKey(bookmark.lesson_key);

              return (
                <div key={bookmark.id || bookmark.lesson_key} className="bookmark-item" onClick={() => handleClick(bookmark)}>
                  <div className="bk-info">
                    <div className="bk-title">{bookmark.lesson_title}</div>
                    <div className="bk-path">
                      {bookmark.course_id.toUpperCase()} {'>'} {moduleTitle || 'Saved lesson'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bk-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleBookmark(bookmark.lesson_key, bookmark.course_id, bookmark.lesson_title);
                    }}
                    title="Remove bookmark"
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
