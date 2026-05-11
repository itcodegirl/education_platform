import { useState, useEffect, useCallback } from 'react';
import { QUIZ_MAP } from '../../data';
import { hasLessonCompletion } from '../../utils/lessonKeys';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { logNavigationDiagnostic } from '../../utils/navigationDiagnostics';

function isLessonUnlocked(course, modules, mi, li, completedSet) {
  if (mi === 0 && li === 0) return true;

  if (li > 0) {
    const prevLesson = modules[mi].lessons[li - 1];
    return hasLessonCompletion(completedSet, course, modules[mi], prevLesson);
  }

  if (mi > 0) {
    const prevMod = modules[mi - 1];
    const lastLesson = prevMod.lessons[prevMod.lessons.length - 1];
    return hasLessonCompletion(completedSet, course, prevMod, lastLesson);
  }

  return true;
}

export function SidebarModuleTree({
  course,
  modules,
  completedSet,
  modIdx,
  lesIdx,
  showModQuiz,
  onSelectLesson,
  onSelectModQuiz,
  activePanel,
  onOpenTool,
}) {
  const [lockMode, setLockMode] = useLocalStorage('chw-lock-mode', false);
  const [expandedMod, setExpandedMod] = useState(modIdx);

  useEffect(() => { setExpandedMod(modIdx); }, [modIdx]);

  const handleLessonSelect = useCallback((module, lesson, mi, li, unlocked) => {
    logNavigationDiagnostic('lesson-click-fired', {
      targetLessonId: lesson?.id || '',
      targetModuleId: module?.id || '',
      targetModuleIndex: mi,
      targetLessonIndex: li,
      unlocked,
      lockMode,
    });

    if (!unlocked) return;
    onSelectLesson(mi, li);
  }, [lockMode, onSelectLesson]);

  return (
    <div className="sidebar-scroll">
      <div className="sidebar-map-header">
        <span className="sidebar-map-title">Modules</span>
        <button
          type="button"
          className={`sidebar-roadmap-btn ${activePanel === 'roadmap' ? 'active' : ''}`}
          onClick={() => onOpenTool('roadmap')}
          aria-label="Open full learning roadmap"
          title="Full roadmap"
        >
          🗺️
        </button>
      </div>
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
                  setExpandedMod(isExpanded ? -1 : mi);
                }}
                disabled={!isModUnlocked}
                aria-expanded={isExpanded}
                aria-label={`${module.title} module${isModUnlocked ? `, ${modDone}/${module.lessons.length} lessons completed` : ', locked by sequence mode'}`}
              >
                <span className="module-group-emoji" aria-hidden="true">{isModUnlocked ? module.emoji : '🔒'}</span>
                <div className="module-group-info">
                  <span className="module-group-name">{module.title}</span>
                  <span className="module-group-sub">{modDone}/{module.lessons.length}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="lesson-list">
                  {module.lessons.map((lesson, li) => {
                    const isDone = hasLessonCompletion(completedSet, course, module, lesson);
                    const unlocked = !lockMode || isLessonUnlocked(course, modules, mi, li, completedSet);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`lesson-list-btn ${mi === modIdx && li === lesIdx && !showModQuiz ? 'act' : ''} ${isDone ? 'dn' : ''} ${!unlocked ? 'locked' : ''}`}
                        onClick={() => handleLessonSelect(module, lesson, mi, li, unlocked)}
                        disabled={!unlocked}
                        aria-label={`${lesson.title} lesson${isDone ? ', completed' : ''}${!unlocked ? ', locked' : ''}`}
                        aria-current={mi === modIdx && li === lesIdx && !showModQuiz ? 'page' : undefined}
                      >
                        <span className="lesson-list-chk" aria-hidden="true">{isDone ? '✓' : unlocked ? '○' : '🔒'}</span>
                        <span>{lesson.title}</span>
                        {mi === modIdx && li === lesIdx && !showModQuiz && <span className="lesson-list-robot" aria-hidden="true">🤖</span>}
                      </button>
                    );
                  })}
                  {QUIZ_MAP.has(`m:${course.id}:${module.id}`) && (
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

      <div className="sidebar-lock-row">
        <label className="lock-label">
          <input
            type="checkbox"
            checked={lockMode}
            onChange={(e) => setLockMode(e.target.checked)}
            aria-label="Toggle sequential lock mode"
          />
          <span className="lock-text">{lockMode ? '🔒 Sequential' : '🔓 Free roam'}</span>
        </label>
      </div>
    </div>
  );
}
