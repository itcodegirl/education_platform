import { useInView } from '../../hooks/useInView';

const PANELS = [
  {
    id: 'html',
    kicker: 'Step 1',
    title: 'Write your first HTML',
    blurb:
      "You'll start by shipping a real page to a real browser. No frameworks. Just tags.",
    lang: 'html',
    code: `<h1>Hi, I'm learning to code.</h1>
<p>And I'm going to ship something real.</p>
<button>Let's go</button>`,
    preview: (
      <div className="lh-preview-html">
        <h1>Hi, I&apos;m learning to code.</h1>
        <p>And I&apos;m going to ship something real.</p>
        <span className="lh-preview-action" aria-hidden="true">
          Let&apos;s go
        </span>
      </div>
    ),
  },
  {
    id: 'css',
    kicker: 'Step 2',
    title: 'Style it until it feels like yours',
    blurb:
      'CSS turns markup into a product. Colors, layout, type, and motion all come from rules.',
    lang: 'css',
    code: `h1 {
  background: linear-gradient(135deg, #b44aff, #e040a0);
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 800;
}
button {
  background: #e040a0;
  color: white;
  padding: 12px 24px;
  border-radius: 9999px;
}`,
    preview: (
      <div className="lh-preview-css">
        <h1 className="lh-css-title">Hi, I&apos;m learning to code.</h1>
        <p>And I&apos;m going to ship something real.</p>
        <span className="lh-preview-action lh-css-button" aria-hidden="true">
          Let&apos;s go
        </span>
      </div>
    ),
  },
  {
    id: 'js',
    kicker: 'Step 3',
    title: 'Make it actually do something',
    blurb:
      'JavaScript is where pages become apps. Click handlers, state, APIs, the whole deal.',
    lang: 'js',
    code: `const btn = document.querySelector('button');
let count = 0;

btn.addEventListener('click', () => {
  count += 1;
  btn.textContent = \`Clicked \${count}x\`;
});`,
    preview: (
      <div className="lh-preview-js">
        <h1 className="lh-css-title">Hi, I&apos;m learning to code.</h1>
        <p>And I&apos;m going to ship something real.</p>
        <span className="lh-preview-action lh-css-button lh-js-button" aria-hidden="true">
          Clicked 3x
        </span>
      </div>
    ),
  },
  {
    id: 'react',
    kicker: 'Step 4',
    title: 'Build real apps with React',
    blurb:
      'Components, props, state, and hooks. Same language you know, just a better way to compose it.',
    lang: 'jsx',
    code: `function CountButton() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicked {count}x
    </button>
  );
}`,
    preview: (
      <div className="lh-preview-react">
        <div className="lh-react-app">
          <span className="lh-react-tag">&lt;App /&gt;</span>
          <span className="lh-preview-action lh-css-button lh-js-button" aria-hidden="true">
            Clicked 3x
          </span>
        </div>
      </div>
    ),
  },
];

function HeroPanel({ panel, index }) {
  const [ref, inView] = useInView({ threshold: 0.25 });
  return (
    <section
      ref={ref}
      className={`lh-panel lh-panel-${panel.id} ${inView ? 'in-view' : ''}`}
      style={{ '--lh-delay': `${index * 80}ms` }}
      aria-label={panel.title}
    >
      <div className="lh-panel-text">
        <span className="lh-kicker">{panel.kicker}</span>
        <h2 className="lh-panel-title">{panel.title}</h2>
        <p className="lh-panel-blurb">{panel.blurb}</p>
      </div>
      <div className="lh-panel-art">
        <div className="lh-code-card" aria-hidden="true">
          <div className="lh-code-head">
            <span className="lh-dot lh-dot-red" />
            <span className="lh-dot lh-dot-amber" />
            <span className="lh-dot lh-dot-green" />
            <span className="lh-code-lang">{panel.lang}</span>
          </div>
          <pre className="lh-code">
            <code>{panel.code}</code>
          </pre>
        </div>
        <div className="lh-preview-card">
          <div className="lh-preview-label">PREVIEW</div>
          <div
            className="lh-preview-body"
            role="img"
            aria-label={`Preview of ${panel.title}`}
          >
            {panel.preview}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingHeroIntro({ onStart, compact = false }) {
  const [introRef, introInView] = useInView({ threshold: 0.1 });

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
        the code, see it run, ask the tutor when you&apos;re stuck.
      </p>
      <div className="lh-cta-row">
        {onStart && (
          <button
            type="button"
            className="lh-cta"
            onClick={onStart}
            aria-label="Create a free account and start your first lesson"
          >
            Create free account
          </button>
        )}
        <a className="lh-cta-ghost" href="/#styleguide" aria-label="Go to the design system">
          Browse design system
        </a>
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

export function LandingHeroStory() {
  return (
    <div className="landing-hero landing-hero-story">
      {PANELS.map((panel, index) => (
        <HeroPanel key={panel.id} panel={panel} index={index} />
      ))}

      <section className="lh-outro">
        <h2 className="lh-outro-title">Ready when you are.</h2>
        <p className="lh-outro-blurb">
          You&apos;ve seen what you&apos;ll build. The first lesson is free -
          no credit card, no signup wall.
        </p>
        <a className="lh-cta" href="#top" aria-label="Back to top">
          Back to top
        </a>
      </section>
    </div>
  );
}

export function LandingHero({ onStart }) {
  return (
    <div className="landing-hero">
      <LandingHeroIntro onStart={onStart} />
      <LandingHeroStory />
    </div>
  );
}
