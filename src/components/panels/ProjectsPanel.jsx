// ═══════════════════════════════════════════════
// PROJECTS PANEL — Build project ideas
// ═══════════════════════════════════════════════

import { useRef, useState } from 'react';
import { PROJECTS } from '../../data/reference/projects';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function ProjectsPanel({ isOpen, onClose, currentCourse }) {
  const [activeCourse, setActiveCourse] = useState(currentCourse);
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });
  if (!isOpen) return null;

  const projects = PROJECTS[activeCourse] || PROJECTS.html;

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Build projects"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <h2>🔨 Build Projects</h2>
          <button type="button" className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cs-btn-row">
          {Object.keys(PROJECTS).map((k) => (
            <button type="button" key={k} className={`cs-trigger ${k === activeCourse ? 'active' : ''}`}
                    onClick={() => setActiveCourse(k)}>{k.toUpperCase()}</button>
          ))}
        </div>
        <div className="cheatsheet-body">
          {projects.map((p, i) => (
            <div key={i} className="project-card">
              <h4>{p.title}</h4>
              <span className={`proj-diff proj-${p.diff}`}>{p.diff}</span>
              <p>{p.desc}</p>
              <div className="proj-skills">
                {p.skills.map((s, j) => <span key={j} className="proj-skill">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
