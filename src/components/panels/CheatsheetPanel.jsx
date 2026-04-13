// ═══════════════════════════════════════════════
// CHEATSHEET PANEL — Quick reference cards
// ═══════════════════════════════════════════════

import { useRef, useState } from 'react';
import { CHEATSHEETS } from '../../data/reference/cheatsheets';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function CheatsheetPanel({ isOpen, onClose, currentCourse }) {
  const [activeCourse, setActiveCourse] = useState(currentCourse);
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });
  if (!isOpen) return null;

  const sections = CHEATSHEETS[activeCourse] || CHEATSHEETS.html;
  const courseKeys = Object.keys(CHEATSHEETS);

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${activeCourse.toUpperCase()} cheat sheet`}
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <h2>📋 {activeCourse.toUpperCase()} Cheat Sheet</h2>
          <button type="button" className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cs-btn-row">
          {courseKeys.map((k) => (
            <button type="button" key={k} className={`cs-trigger ${k === activeCourse ? 'active' : ''}`}
                    onClick={() => setActiveCourse(k)}>{k.toUpperCase()}</button>
          ))}
        </div>
        <div className="cheatsheet-body">
          {sections.map((s, i) => (
            <div key={i} className="cs-section">
              <h3>{s.title}</h3>
              <div className="cs-grid">
                {s.items.map(([syntax, desc], j) => (
                  <div key={j} className="cs-item">
                    <code>{syntax}</code>
                    <div className="cs-desc">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
