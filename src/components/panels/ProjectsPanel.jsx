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
    <div className="search-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Build projects"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Build something real</p>
            <h2>Build Projects</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close projects">
            ×
          </button>
        </div>
        <div className="cs-btn-row">
          {Object.keys(PROJECTS).map((courseKey) => (
            <button
              type="button"
              key={courseKey}
              className={`cs-trigger ${courseKey === activeCourse ? 'active' : ''}`}
              onClick={() => setActiveCourse(courseKey)}
            >
              {courseKey.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="cheatsheet-body">
          <p className="panel-meta">
            Use these as your next proof-of-work build when you want to ship, stretch, and connect lessons to portfolio-ready output.
          </p>
          {projects.map((project, index) => (
            <div key={`${project.title}-${index}`} className="project-card">
              <h4>{project.title}</h4>
              <span className={`proj-diff proj-${project.diff}`}>{project.diff}</span>
              <p>{project.desc}</p>
              <div className="proj-skills">
                {project.skills.map((skill, skillIndex) => (
                  <span key={`${skill}-${skillIndex}`} className="proj-skill">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
