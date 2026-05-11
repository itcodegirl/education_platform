// Lock-mode toggle that lives at the bottom of the sidebar. Pure
// presentational. The parent owns the lockMode state via
// useLearnerLocalStorage so the preference persists per learner.

import { memo } from 'react';

export const SidebarLockToggle = memo(function SidebarLockToggle({ lockMode, onToggle }) {
  return (
    <div className="sidebar-lock-row">
      <label className="lock-label">
        <input
          type="checkbox"
          checked={lockMode}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label="Toggle guided lesson order"
        />
        <span className="lock-copy">
          <span className="lock-text">{lockMode ? 'Guided order on' : 'Open navigation'}</span>
          <span className="lock-help">
            {lockMode
              ? 'Lessons unlock step by step as you complete them.'
              : 'You can browse lessons in any order.'}
          </span>
        </span>
      </label>
    </div>
  );
});
