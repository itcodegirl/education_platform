import { useInView } from '../../hooks/useInView';

export function LandingHeroIntro({ onStart, onPreview, compact = false }) {
  const [introRef, introInView] = useInView({ threshold: 0.1 });
  const startIsPrimary = !onPreview;

  return (
    <section
      ref={introRef}
      id="landing-hero-intro"
      className={`lh-intro ${compact ? 'lh-intro-compact' : ''} ${introInView ? 'in-view' : ''}`}
    >
      <h1 id="landing-hero-title" className="lh-headline">
        Learn to code by{' '}
        <span className="lh-headline-grad">building something real.</span>
      </h1>
      <p className="lh-lede">
        CodeHerWay takes you from <span className="lh-inline-code">&lt;h1&gt;Hi&lt;/h1&gt;</span> to a
        shipped React app in one clear, opinionated lesson at a time. Write
        the code, see it run, and keep moving with one clear next step.
      </p>
      <div className="lh-cta-row">
        {onPreview && (
          <button
            type="button"
            className="lh-cta ui-btn ui-btn-primary ui-btn-pill"
            onClick={onPreview}
            aria-label="Preview the first lesson before creating an account"
          >
            Start first lesson
          </button>
        )}
        {onStart && (
          <button
            type="button"
            className={startIsPrimary
              ? 'lh-cta ui-btn ui-btn-primary ui-btn-pill'
              : 'lh-cta-ghost ui-btn ui-btn-secondary'}
            onClick={onStart}
            aria-label="Create a free account"
          >
            Create account
          </button>
        )}
      </div>
      {!compact && (
        <div className="lh-scroll-cue" aria-hidden="true">
          <span />
          <span>scroll to see what you&apos;ll build</span>
        </div>
      )}
    </section>
  );
}
