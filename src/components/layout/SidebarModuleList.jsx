// Sidebar module/lesson tree. Pure presentational. The parent
// (Sidebar) owns:
//   - completion / lock state via ProgressContext
//   - which module is expanded (so collapse/expand survives
//     tab-switching inside the sidebar)
//   - the lesson-select handler that decides whether to navigate
//     based on the unlocked predicate
//
// Extracted from Sidebar.jsx so the tree can be reasoned about and
// tested in isolation. ~80 LOC of dense conditional markup that
// previously lived inside a 667-line file.

import { memo } from 'react';
import { hasLessonCompletion } from '../../utils/lessonKeys';
import { isLessonUnlocked } from '../../utils/lessonUnlock';
import { hasQuiz } from '../../data';

export const SidebarModuleList = memo(function SidebarModuleList({
  course,
  modules,
  modIdx,
  lesIdx,
  showModQuiz,
  completedSet,
  expandedMod,
  onToggleExpand,
  lockMode,
  onLessonSelect,
  onSelectModQuiz,
  activePanel,
  onOpenRoadmap,
}) {
  return (
    <>
      <div className="sidebar-map-header">
        <span className="sidebar-map-title">Modules</span>
        <button
          type="button"
          className={`sidebar-roadmap-btn ${activePanel === 'roadmap' ? 'active' : ''}`}
          onClick={onOpenRoadmap}
          aria-label="Open full learning roadmap"
          title="Full roadmap"
        >
          🗺️
        </button>
      </div>
      {/* The outer <nav aria-label="Course navigation"> already exposes
          this region as a landmark — this inner list does not need its
          own nested <nav> (would be noisy for screen readers). */}
      <div className="sidebar-nav">
        {modules.map((module, mi) => {
          const modDone = module.lessons.filter((lesson) =>
            hasLessonCompletion(completedSet, course, module, lesson),
          ).length;
          const isModUnlocked = !lockMode || isLessonUnlocked(course, modules, mi, 0, completedSet);
          const isExpanded = expandedMod === mi;

          return (
            <div
              key={module.id}
              className={`module-group ${mi === modIdx ? 'act' : ''} ${isExpanded ? 'expanded' : ''} ${!isModUnlocked ? 'locked' : ''}`}
            >
              <button
                type="button"
                className="module-group-btn"
                onClick={() => {
                  if (!isModUnlocked) return;
                  onToggleExpand(isExpanded ? -1 : mi);
                }}
                disabled={!isModUnlocked}
                title={!isModUnlocked ? 'Finish the previous module to unlock' : undefined}
                aria-expanded={isExpanded}
                aria-label={`${module.title} module${isModUnlocked ? `, ${modDone}/${module.lessons.length} lessons completed` : ', locked until the previous module is complete'}`}
              >
                <span className="module-group-emoji" aria-hidden="true">{isModUnlocked ? module.emoji : '🔒'}</span>
                <div className="module-group-info">
                  <span className="module-group-name">{module.title}</span>
                  <span className="module-group-sub">
                    {isModUnlocked ? `${modDone}/${module.lessons.length}` : 'Locked'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="lesson-list">
                  {module.lessons.map((lesson, li) => {
                    const isDone = hasLessonCompletion(completedSet, course, module, lesson);
                    const unlocked = !lockMode || isLessonUnlocked(course, modules, mi, li, completedSet);
                    const lessonState = isDone ? 'Done' : unlocked ? 'Ready' : 'Locked';
                    const isActive = mi === modIdx && li === lesIdx && !showModQuiz;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`lesson-list-btn ${isActive ? 'act' : ''} ${isDone ? 'dn' : ''} ${!unlocked ? 'locked' : ''}`}
                        onClick={() => onLessonSelect(module, lesson, mi, li, unlocked)}
                        disabled={!unlocked}
                        title={!unlocked ? 'Complete the previous lesson to unlock' : undefined}
                        aria-label={`${lesson.title} lesson, ${lessonState.toLowerCase()}${!unlocked ? ' until the previous lesson is complete' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="lesson-list-chk" aria-hidden="true">{isDone ? '✓' : unlocked ? '○' : '🔒'}</span>
                        <span className="lesson-list-title">{lesson.title}</span>
                        <span className="lesson-list-state">{lessonState}</span>
                        {isActive && <span className="lesson-list-robot" aria-hidden="true">🤖</span>}
                      </button>
                    );
                  })}
                  {hasQuiz(course.id, 'm', module.id) && (
                    <button
                      type="button"
                      className={`lesson-list-btn lesson-list-quiz ${showModQuiz && mi === modIdx ? 'act' : ''}`}
                      onClick={() => onSelectModQuiz(mi)}
                      aria-label={`Open module quiz for ${module.title}`}
                    >
                      <span className="lesson-list-chk" aria-hidden="true">📝</span>
                      <span>Module Quiz</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
});
