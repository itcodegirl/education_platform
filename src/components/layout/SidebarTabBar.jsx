import { memo } from 'react';

const RESOURCE_TOOLS = [
  { key: 'cheatsheet', icon: '📋', label: 'Cheat Sheets' },
  { key: 'glossary',   icon: '📖', label: 'Glossary'    },
  { key: 'bookmarks',  icon: '⭐', label: 'Bookmarks'   },
  { key: 'sr',         icon: '🔄', label: 'Review'      },
  { key: 'challenges', icon: '🏋️', label: 'Challenges'  },
  { key: 'badges',     icon: '🏆', label: 'Badges'      },
];

export const SidebarTabBar = memo(function SidebarTabBar({
  courses,
  courseIdx,
  course,
  courseDone,
  total,
  pct,
  activePopout,
  popoutPos,
  tabsRef,
  popoutRef,
  coursesTabRef,
  resourcesTabRef,
  activePanel,
  onTabClick,
  onTabKeyDown,
  onPopoutKeyDown,
  onSelectCourse,
  onOpenTool,
  onClosePopout,
}) {
  return (
    <>
      <div className="sidebar-tabs" ref={tabsRef} aria-label="Sidebar navigation">
        <button
          id="sidebar-tab-courses"
          ref={coursesTabRef}
          type="button"
          className={`sidebar-tab ${activePopout === 'courses' ? 'active' : ''}`}
          onClick={() => onTabClick('courses')}
          onKeyDown={onTabKeyDown('courses')}
          aria-haspopup="menu"
          aria-expanded={activePopout === 'courses'}
          aria-controls="sidebar-tab-panel-courses"
        >
          <span className="sidebar-tab-icon" aria-hidden="true">📚</span>
          <span className="sidebar-tab-label">Courses</span>
          <span className="sidebar-tab-arrow" aria-hidden="true">▸</span>
        </button>

        <button
          id="sidebar-tab-resources"
          ref={resourcesTabRef}
          type="button"
          className={`sidebar-tab ${activePopout === 'resources' ? 'active' : ''}`}
          onClick={() => onTabClick('resources')}
          onKeyDown={onTabKeyDown('resources')}
          aria-haspopup="menu"
          aria-expanded={activePopout === 'resources'}
          aria-controls="sidebar-tab-panel-resources"
        >
          <span className="sidebar-tab-icon" aria-hidden="true">📋</span>
          <span className="sidebar-tab-label">Resources</span>
          <span className="sidebar-tab-arrow" aria-hidden="true">▸</span>
        </button>

        <div className="sidebar-tabs-context" style={{ '--cs-accent': course.accent }}>
          <span className="sidebar-tabs-context-icon" aria-hidden="true">{course.icon}</span>
          <span className="sidebar-tabs-context-label">{course.label}</span>
          <span className="sidebar-tabs-context-meta">{courseDone}/{total}</span>
          <div className="sidebar-tabs-context-progress">
            <div
              className="sidebar-tabs-context-fill"
              style={{ width: `${pct}%`, background: course.accent }}
            />
          </div>
        </div>
      </div>

      {activePopout && popoutPos && (
        <div
          ref={popoutRef}
          id={`sidebar-tab-panel-${activePopout}`}
          className={`sidebar-tab-flyout sidebar-tab-flyout-${activePopout} ${popoutPos.mode === 'docked' ? 'docked' : ''}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={activePopout === 'courses' ? 'sidebar-tab-courses' : 'sidebar-tab-resources'}
          aria-label={activePopout === 'courses' ? 'Select course' : 'Open a learning tool'}
          onKeyDown={onPopoutKeyDown}
          style={popoutPos.mode === 'fixed' ? { top: popoutPos.top, left: popoutPos.left } : undefined}
        >
          {activePopout === 'courses' &&
            courses.map((c, ci) => (
              <button
                key={c.id}
                type="button"
                role="menuitem"
                className={`cs-option ${ci === courseIdx ? 'active' : ''}`}
                onClick={() => {
                  onSelectCourse(ci);
                  onClosePopout();
                }}
                style={{ '--cs-accent': c.accent }}
                aria-label={`Switch to ${c.label} course`}
              >
                <span className="cs-option-icon" aria-hidden="true">{c.icon}</span>
                <span className="cs-option-label">{c.label}</span>
                {ci === courseIdx && <span className="cs-option-check" aria-hidden="true">✓</span>}
              </button>
            ))}

          {activePopout === 'resources' &&
            RESOURCE_TOOLS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="menuitem"
                className={`sidebar-tab-opt ${activePanel === t.key ? 'active' : ''}`}
                aria-pressed={activePanel === t.key}
                onClick={() => {
                  onOpenTool(t.key);
                  onClosePopout();
                }}
                aria-label={`Open ${t.label} panel`}
              >
                <span className="sidebar-tab-opt-icon" aria-hidden="true">{t.icon}</span>
                <span className="sidebar-tab-opt-label">{t.label}</span>
              </button>
            ))}
        </div>
      )}
    </>
  );
});
