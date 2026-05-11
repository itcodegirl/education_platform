// CHEATSHEET PANEL - Quick reference cards

import { useRef, useState } from "react";
import { CHEATSHEETS } from "../../data/reference/cheatsheets";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export function CheatsheetPanel({ isOpen, onClose, currentCourse }) {
  const [activeCourse, setActiveCourse] = useState(currentCourse);
  const modalRef = useRef(null);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const sections = CHEATSHEETS[activeCourse] || [];
  const courseKeys = Object.keys(CHEATSHEETS);
  const displayCourse = (activeCourse || 'reference').toUpperCase();

  return (
    <div
      className="search-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${displayCourse} cheat sheet`}
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Quick reference</p>
            <h2>📋 {displayCourse} Cheat Sheet</h2>
          </div>
          <button
            type="button"
            className="cheatsheet-close"
            onClick={onClose}
            aria-label="Close cheat sheet"
          >
            ×
          </button>
        </div>

        <div className="cs-btn-row">
          {courseKeys.map((courseKey) => (
            <button
              type="button"
              key={courseKey}
              className={`cs-trigger ${courseKey === activeCourse ? "active" : ""}`}
              onClick={() => setActiveCourse(courseKey)}
            >
              {courseKey.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="cheatsheet-body">
          <p className="panel-meta">
            Switch stacks to keep syntax, tags, and common patterns close while
            you work through lessons.
          </p>
          {sections.length === 0 ? (
            <div className="sr-empty">
              <p><strong>No quick references available for this track yet.</strong></p>
              <p className="empty-state-msg">
                Stay with the lesson content for now. Reference cards will appear here when this track has them.
              </p>
            </div>
          ) : (
            sections.map((section, index) => (
              <div key={index} className="cs-section">
                <h3>{section.title}</h3>
                <div className="cs-grid">
                  {section.items.map(([syntax, desc], itemIndex) => (
                    <div key={itemIndex} className="cs-item">
                      <code>{syntax}</code>
                      <div className="cs-desc">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
