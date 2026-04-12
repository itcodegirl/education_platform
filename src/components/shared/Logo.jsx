// ═══════════════════════════════════════════════
// LOGO — <Code>Her</Way> brand wordmark
//
// Brackets: South Carolina blue (#56a0d3)
// "Her": gradient purple→pink (#7B61FF → #FF6FD8)
// Tagline: console.log("you belong here");
//
// Variants:
//   size="sm"  → sidebar/nav (default)
//   size="lg"  → auth page, splash screens
//   size="icon" → just <H/>
//   showTagline → adds console.log line below
// ═══════════════════════════════════════════════

import { memo } from 'react';

export const Logo = memo(function Logo({ size = 'sm', className = '', showTagline = false }) {
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
    <div className={`logo-wrap logo-wrap-${size} ${className}`}>
      <span className={`logo logo-${size}`} aria-label="CodeHerWay">
        <span className="logo-bracket">&lt;</span>
        <span className="logo-code">Code</span>
        <span className="logo-bracket">&gt;</span>
        <span className="logo-her">Her</span>
        <span className="logo-bracket">&lt;/</span>
        <span className="logo-way">Way</span>
        <span className="logo-bracket">&gt;</span>
      </span>
      {showTagline && (
        <span className="logo-tagline">
          <span className="logo-tg-fn">console</span>
          <span className="logo-tg-dot">.</span>
          <span className="logo-tg-method">log</span>
          <span className="logo-tg-paren">(</span>
          <span className="logo-tg-string">"you belong here"</span>
          <span className="logo-tg-paren">)</span>
          <span className="logo-tg-semi">;</span>
        </span>
      )}
    </div>
  );
});
