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

        <div className="cs-btn-row" role="group" aria-label="Cheat sheet course tracks">
          {courseKeys.map((courseKey) => (
            <button
              type="button"
              key={courseKey}
              className={`cs-trigger ${courseKey === activeCourse ? "active" : ""}`}
              aria-pressed={courseKey === activeCourse}
              aria-controls="cheatsheet-panel-content"
              aria-label={`Show ${courseKey.toUpperCase()} cheat sheet`}
              onClick={() => setActiveCourse(courseKey)}
            >
              {courseKey.toUpperCase()}
            </button>
          ))}
        </div>

        <div
          id="cheatsheet-panel-content"
          className="cheatsheet-body"
          role="region"
          aria-label={`${displayCourse} cheat sheet content`}
        >
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
                <ul className="cs-grid" aria-label={`${section.title} references`}>
                  {section.items.map(([syntax, desc], itemIndex) => (
                    <li key={itemIndex} className="cs-item">
                      <code>{syntax}</code>
                      <div className="cs-desc">{desc}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
