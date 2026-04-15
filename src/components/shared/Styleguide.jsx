// ═══════════════════════════════════════════════
// STYLEGUIDE — Visual reference for the design
// tokens defined in src/styles/tokens.css.
//
// Open at #styleguide (no login required). Useful
// for design review, CSS audits, and as a portfolio
// artifact — shows at a glance that the project
// has an actual design system, not ad-hoc colors.
// ═══════════════════════════════════════════════

const COLOR_TOKENS = [
  { name: 'bg-deep',     varName: '--bg-deep',     hex: '#0d0d1a' },
  { name: 'bg-dark',     varName: '--bg-dark',     hex: '#12122a' },
  { name: 'bg-card',     varName: '--bg-card',     hex: '#181836' },
  { name: 'bg-surface',  varName: '--bg-surface',  hex: '#1e1e40' },
  { name: 'border',      varName: '--border',      hex: '#2d2d5e' },
  { name: 'pink',        varName: '--pink',        hex: '#e040a0' },
  { name: 'cyan',        varName: '--cyan',        hex: '#00e5ff' },
  { name: 'purple',      varName: '--purple',      hex: '#b44aff' },
  { name: 'amber',       varName: '--amber',       hex: '#ffa726' },
  { name: 'red',         varName: '--red',         hex: '#ff5c7c' },
];

const GRADIENTS = [
  { name: 'grad-brand', varName: '--grad-brand' },
  { name: 'grad-neon',  varName: '--grad-neon'  },
  { name: 'grad-warm',  varName: '--grad-warm'  },
  { name: 'grad-glow',  varName: '--grad-glow'  },
];

const SPACING = [
  { name: 'space-1',  varName: '--space-1',  px: 4 },
  { name: 'space-2',  varName: '--space-2',  px: 8 },
  { name: 'space-3',  varName: '--space-3',  px: 16 },
  { name: 'space-4',  varName: '--space-4',  px: 24 },
  { name: 'space-5',  varName: '--space-5',  px: 32 },
  { name: 'space-6',  varName: '--space-6',  px: 40 },
  { name: 'space-7',  varName: '--space-7',  px: 48 },
  { name: 'space-8',  varName: '--space-8',  px: 56 },
  { name: 'space-9',  varName: '--space-9',  px: 64 },
  { name: 'space-10', varName: '--space-10', px: 80 },
];

const TYPE_SCALE = [
  { name: 'text-xs',   varName: '--text-xs',   sample: 'The quick brown fox' },
  { name: 'text-sm',   varName: '--text-sm',   sample: 'The quick brown fox' },
  { name: 'text-base', varName: '--text-base', sample: 'The quick brown fox' },
  { name: 'text-md',   varName: '--text-md',   sample: 'The quick brown fox' },
  { name: 'text-lg',   varName: '--text-lg',   sample: 'The quick brown fox' },
  { name: 'text-xl',   varName: '--text-xl',   sample: 'The quick brown fox' },
  { name: 'text-2xl',  varName: '--text-2xl',  sample: 'The quick brown fox' },
  { name: 'text-3xl',  varName: '--text-3xl',  sample: 'The quick brown fox' },
];

const RADII = [
  { name: 'radius-sm',   varName: '--radius-sm',   px: 4 },
  { name: 'radius-md',   varName: '--radius-md',   px: 8 },
  { name: 'radius-lg',   varName: '--radius-lg',   px: 12 },
  { name: 'radius-xl',   varName: '--radius-xl',   px: 16 },
  { name: 'radius-full', varName: '--radius-full', px: 9999 },
];

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
};

const sectionTitle = {
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 'var(--space-3)',
  fontFamily: 'Poppins, Inter, system-ui, sans-serif',
};

const tokenLabel = {
  fontFamily: '"Space Mono", ui-monospace, monospace',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-dim)',
};

export function Styleguide({ onClose }) {
  return (
    <div
      style={{
        // `dvh` handles mobile browser chrome better than `vh`. All
        // evergreen browsers support it (Safari 15.4+, Chrome 108+,
        // Firefox 101+). The duplicate `minHeight: '100vh'` fallback
        // that used to sit here was silently overwritten by this line
        // in the JS object anyway — in a React style={} object, the
        // second key just wins, so the fallback was dead code that
        // also tripped an esbuild duplicate-key warning on every build.
        minHeight: '100dvh',
        background: 'var(--bg-deep)',
        color: 'var(--text)',
        padding: 'var(--space-5)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 800,
                fontFamily: 'Poppins, Inter, sans-serif',
                background: 'var(--grad-brand)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 'var(--space-2)',
              }}
            >
              CodeHerWay Styleguide
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 'var(--text-md)' }}>
              The design tokens behind the platform. Source:{' '}
              <code
                style={{
                  fontFamily: '"Space Mono", monospace',
                  background: 'var(--bg-surface)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                src/styles/tokens.css
              </code>
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-4)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--text-base)',
              }}
            >
              Close
            </button>
          )}
        </header>

        {/* Colors */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Brand palette</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {COLOR_TOKENS.map((c) => (
              <div key={c.name}>
                <div
                  style={{
                    height: '72px',
                    background: `var(${c.varName})`,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                />
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{c.name}</div>
                  <div style={tokenLabel}>{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Gradients</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {GRADIENTS.map((g) => (
              <div key={g.name}>
                <div
                  style={{
                    height: '110px',
                    background: `var(${g.varName})`,
                    borderRadius: 'var(--radius-lg)',
                  }}
                />
                <div style={{ ...tokenLabel, marginTop: 'var(--space-2)' }}>{g.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Spacing scale (8pt grid)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {SPACING.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ ...tokenLabel, width: '80px' }}>{s.name}</span>
                <div
                  style={{
                    width: `var(${s.varName})`,
                    height: '16px',
                    background: 'var(--grad-brand)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <span style={{ ...tokenLabel }}>{s.px}px</span>
              </div>
            ))}
          </div>
        </section>

        {/* Type scale */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Type scale (fluid with clamp)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {TYPE_SCALE.map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
                <span style={{ ...tokenLabel, width: '80px' }}>{t.name}</span>
                <span style={{ fontSize: `var(${t.varName})`, color: 'var(--text)' }}>
                  {t.sample}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Radii */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Radii</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {RADII.map((r) => (
              <div key={r.name}>
                <div
                  style={{
                    height: '72px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-bright)',
                    borderRadius: `var(${r.varName})`,
                  }}
                />
                <div style={{ ...tokenLabel, marginTop: 'var(--space-2)' }}>
                  {r.name} · {r.px === 9999 ? 'pill' : `${r.px}px`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample components */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Sample components</h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              style={{
                background: 'var(--grad-brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(180, 74, 255, 0.25)',
              }}
            >
              Primary button
            </button>

            <button
              type="button"
              style={{
                background: 'transparent',
                color: 'var(--cyan)',
                border: '1px solid var(--cyan)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Secondary
            </button>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'var(--pink-dim)',
                color: 'var(--pink)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              🔥 7-day streak
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'var(--cyan-dim)',
                color: 'var(--cyan)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              +50 XP
            </span>
          </div>

          <div
            style={{
              marginTop: 'var(--space-4)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              maxWidth: '380px',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
              Lesson card
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              What HTML actually is
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
              5 concepts · 3 challenges · ~12 min
            </div>
          </div>
        </section>

        <footer
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Tokens defined in{' '}
          <code style={{ fontFamily: '"Space Mono", monospace' }}>src/styles/tokens.css</code>
          {' · '}
          Open this page at any time via{' '}
          <code style={{ fontFamily: '"Space Mono", monospace' }}>#styleguide</code>
        </footer>
      </div>
    </div>
  );
}
