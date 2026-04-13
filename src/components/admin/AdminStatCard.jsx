// Small presentational card for the admin Overview tab. One of a
// grid of 8, each showing an icon, a numeric value, and a label.
// Accent overrides the value color for visual variety.

export function AdminStatCard({ label, value, icon, accent }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon" aria-hidden="true">{icon}</div>
      <div className="admin-stat-info">
        <div
          className="admin-stat-value"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
