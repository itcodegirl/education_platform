// ═══════════════════════════════════════════════
// LBField — Labelled form field used throughout
// the Lesson Builder edit view.
// ═══════════════════════════════════════════════

export function LBField({ label, hint, span2, children }) {
  return (
    <div className={`lb-field ${span2 ? 'lb-field-span2' : ''}`}>
      <label className="lb-label">
        {label}
        {hint && <span className="lb-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
