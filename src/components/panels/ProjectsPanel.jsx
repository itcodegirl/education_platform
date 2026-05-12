import { useRef, useState } from 'react';
import { PROJECTS } from '../../data/reference/projects';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function ProjectsPanel({ isOpen, onClose, currentCourse, hasCompletedProgress = true }) {
  const [activeCourse, setActiveCourse] = useState(currentCourse);
  const modalRef = useRef(null);

  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: 'first-tabbable',
  });

  if (!isOpen) return null;

  const projects = PROJECTS[activeCourse] || PROJECTS.html;
  const courseKeys = Object.keys(PROJECTS);
  const displayCourse = (activeCourse || 'html').toUpperCase();

  return (
    <div className="search-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="projects-panel-title"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Build something real</p>
            <h2 id="projects-panel-title">Build Projects</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close projects">
            ×
          </button>
        </div>
        <div className="cs-btn-row" role="group" aria-label="Project course tracks">
          {courseKeys.map((courseKey) => (
            <button
              type="button"
              key={courseKey}
              className={`cs-trigger ${courseKey === activeCourse ? 'active' : ''}`}
              aria-pressed={courseKey === activeCourse}
              aria-controls="projects-panel-content"
              aria-label={`Show ${courseKey.toUpperCase()} projects`}
              onClick={() => setActiveCourse(courseKey)}
            >
              {courseKey.toUpperCase()}
            </button>
          ))}
        </div>
        <div
          id="projects-panel-content"
          className="cheatsheet-body"
          role="region"
          aria-label={`${displayCourse} project ideas`}
        >
          <p className="panel-meta">
            Use these as your next proof-of-work build when you want to ship, stretch, and connect lessons to portfolio-ready output.
          </p>
          {!hasCompletedProgress ? (
            <div className="sr-empty">
              <span className="sr-empty-icon" aria-hidden="true">&lt;/&gt;</span>
              <p><strong>Projects unlock after your first completed lesson.</strong></p>
              <p className="empty-state-msg">
                Finish one lesson first so the project list feels like a next step,
                not another tab competing for attention.
              </p>
              <button type="button" className="empty-state-action" onClick={onClose}>
                Back to current lesson
              </button>
            </div>
          ) : (
            <ul className="project-list" aria-label={`${displayCourse} project ideas`}>
              {projects.map((project, index) => {
                const projectTitleId = `project-${activeCourse}-${index}-title`;

                return (
                  <li
                    key={`${project.title}-${index}`}
                    className="project-card"
                    aria-labelledby={projectTitleId}
                  >
                    <h3 id={projectTitleId}>{project.title}</h3>
                    <span className={`proj-diff proj-${project.diff}`}>{project.diff}</span>
                    <p>{project.desc}</p>
                    <ul className="proj-skills" aria-label={`Skills for ${project.title}`}>
                      {project.skills.map((skill, skillIndex) => (
                        <li key={`${skill}-${skillIndex}`} className="proj-skill">{skill}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
