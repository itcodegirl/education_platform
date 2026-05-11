// Reusable empty-state card used across panels and pages.
// Keeps the "no data yet" visual consistent and on-brand.
export function EmptyState({ icon, headline, subtext, cta }) {
  return (
    <div className="empty-state" role="status">
      {icon && (
        <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      )}
      <p className="empty-state-headline">{headline}</p>
      {subtext && (
        <p className="empty-state-subtext">{subtext}</p>
      )}
      {cta && (
        <div className="empty-state-cta">{cta}</div>
      )}
    </div>
  );
}
