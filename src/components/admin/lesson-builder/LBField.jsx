// Children sit inside <label> so the input is implicitly associated
// with its label text — no htmlFor/id pairing required, which keeps
// the form simple and forgiving as fields move around.
export function LBField({ label, hint, span2, children }) {
  return (
    <div className={`lb-field ${span2 ? 'lb-field-span2' : ''}`}>
      <label className="lb-label">
        <span className="lb-label-text">
          {label}
          {hint && <span className="lb-hint">{hint}</span>}
        </span>
        {children}
      </label>
    </div>
  );
}
