export function SidebarCourseTab({ courses, courseIdx, onSelectCourse }) {
  return (
    <>
      {courses.map((c, ci) => (
        <button
          key={c.id}
          type="button"
          role="menuitem"
          className={`cs-option ${ci === courseIdx ? 'active' : ''}`}
          onClick={() => onSelectCourse(ci)}
          style={{ '--cs-accent': c.accent }}
          aria-label={`Switch to ${c.label} course`}
        >
          <span className="cs-option-icon" aria-hidden="true">{c.icon}</span>
          <span className="cs-option-label">{c.label}</span>
          {ci === courseIdx && <span className="cs-option-check" aria-hidden="true">✓</span>}
        </button>
      ))}
    </>
  );
}
