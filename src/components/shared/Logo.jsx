// ═══════════════════════════════════════════════
// LOGO — <Code>Her</Way> brand wordmark
//
// Per logo spec: code-inspired wordmark where "Her"
// is highlighted with a soft gradient, balancing
// technical structure with empowering identity.
//
// Variants:
//   size="sm"  → sidebar/nav (default)
//   size="lg"  → auth page, splash screens
//   size="icon" → just <H/>
// ═══════════════════════════════════════════════

import { memo } from 'react';

export const Logo = memo(function Logo({ size = 'sm', className = '' }) {
  if (size === 'icon') {
    return (
      <span className={`logo logo-icon ${className}`} aria-label="CodeHerWay">
        <span className="logo-bracket">&lt;</span>
        <span className="logo-her">H</span>
        <span className="logo-bracket">/&gt;</span>
      </span>
    );
  }

  return (
    <span className={`logo logo-${size} ${className}`} aria-label="CodeHerWay">
      <span className="logo-bracket">&lt;</span>
      <span className="logo-code">Code</span>
      <span className="logo-bracket">&gt;</span>
      <span className="logo-her">Her</span>
      <span className="logo-bracket">&lt;/</span>
      <span className="logo-way">Way</span>
      <span className="logo-bracket">&gt;</span>
    </span>
  );
});
