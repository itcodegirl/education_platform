// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOGO â€” <Code>Her</Way> brand wordmark
//
// Brackets: South Carolina blue (#56a0d3)
// "Her": gradient purpleâ†’pink (#7B61FF â†’ #FF6FD8)
// Tagline: console.log("you belong here");
//
// Variants:
//   size="sm"  â†’ sidebar/nav (default)
//   size="lg"  â†’ auth page, splash screens
//   size="icon" â†’ just <H/>
//   showTagline â†’ adds console.log line below
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import { memo } from 'react';

export const Logo = memo(function Logo({ size = 'sm', className = '', showTagline = false }) {
  if (size === 'icon') {
    return (
      <span className={`logo logo-icon ${className}`} aria-label="Cinova">
        <span className="logo-bracket">&lt;</span>
        <span className="logo-her">H</span>
        <span className="logo-bracket">/&gt;</span>
      </span>
    );
  }

  return (
    <div className={`logo-wrap logo-wrap-${size} ${className}`}>
      <span className={`logo logo-${size}`} aria-label="Cinova">
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

