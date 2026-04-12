// ═══════════════════════════════════════════════
// STAT CARD — Small labelled metric tile used on
// the Admin Dashboard overview grid.
// ═══════════════════════════════════════════════

export function StatCard({ label, value, icon, accent }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-info">
        <div className="admin-stat-value" style={accent ? { color: accent } : {}}>{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
