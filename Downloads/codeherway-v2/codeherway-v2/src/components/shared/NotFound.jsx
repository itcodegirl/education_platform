// ═══════════════════════════════════════════════
// 404 — Branded "Page Not Found"
// ═══════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="eb-screen">
      <div className="eb-card">
        <span className="eb-icon">🔍</span>
        <h2 className="eb-title">Page not found</h2>
        <p className="eb-msg">
          This lesson doesn't exist — maybe the URL is wrong, or it was moved.
        </p>
        <div className="eb-actions">
          <button className="eb-retry" onClick={() => navigate('/')}>
            ← Back to Learning
          </button>
        </div>
        <p className="eb-help">
          If you think this is a bug, contact{' '}
          <a href="mailto:hello@codeherway.com">support</a>.
        </p>
      </div>
    </div>
  );
}
