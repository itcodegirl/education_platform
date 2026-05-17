export const CSS_QUIZ_QUALITY_ITEMS = Object.freeze({
  'c2-1:c2a1': {
    id: 'c2a8',
    type: 'bug',
    question: 'Scenario: a heading rule stops applying after a teammate edits the CSS. Which line is the syntax mistake?',
    lines: ['h1 {', '  color red;', '  font-size: 2rem;', '}'],
    correct: 1,
    explanation: 'CSS declarations need a colon between property and value. Use color: red; so the browser can parse the rule.',
  },
  'c2-2:c2b1': {
    id: 'c2b8',
    type: 'bug',
    question: 'Scenario: a stylesheet is hard to review because unrelated styles are mixed together. Which line is the organization mistake?',
    lines: ['put nav, forms, cards, and footer rules in random order', 'group related rules under clear section comments'],
    correct: 0,
    explanation: 'Random ordering makes CSS hard to maintain. Group related rules so future changes have an obvious home.',
  },
  'c3-1:c3a1': {
    id: 'c3a8',
    type: 'bug',
    question: 'Scenario: a class selector does not style any cards. Which line is the selector mistake?',
    lines: ['card {', '  border: 1px solid #ddd;', '}'],
    correct: 0,
    explanation: 'A class selector needs a dot. Use .card to target elements with class="card".',
  },
  'c3-2:c3b1': {
    id: 'c3b8',
    type: 'bug',
    question: 'Scenario: every paragraph in the app becomes tiny after adding a nested-card rule. Which line is the descendant-selector mistake?',
    lines: ['p { font-size: 12px; }', '.card p { font-size: 12px; }'],
    correct: 0,
    explanation: 'The bare p selector targets every paragraph. Scope the rule to .card p when only card copy should change.',
  },
  'c3-3:c3c1': {
    id: 'c3c8',
    type: 'bug',
    question: 'Scenario: an ID rule keeps overriding reusable button classes. Which line is the specificity mistake?',
    lines: ['#submit { background: red; }', '.button-primary { background: green; }'],
    correct: 0,
    explanation: 'ID selectors have high specificity and can fight reusable classes. Prefer class selectors for component styling.',
  },
  'c4-1:c4a1': {
    id: 'c4a8',
    type: 'bug',
    question: 'Scenario: a brand color does not render and the button falls back to default styling. Which line is the color-value mistake?',
    lines: ['.button {', '  background: #45;', '}'],
    correct: 1,
    explanation: 'A short hex color needs three or four valid hex digits, or use a full six-digit value like #4455aa.',
  },
  'c4-2:c4b1': {
    id: 'c4b8',
    type: 'bug',
    question: 'Scenario: paragraph spacing looks cramped after a typography update. Which line is the readability mistake?',
    lines: ['p { line-height: 1; }', 'p { max-width: 65ch; }'],
    correct: 0,
    explanation: 'A line-height of 1 is usually too tight for body copy. Use a more readable value such as 1.5 or 1.6.',
  },
  'c4-3:c4c1': {
    id: 'c4c8',
    type: 'bug',
    question: 'Scenario: a card looks huge on mobile because a fixed pixel size never adapts. Which line is the unit mistake?',
    lines: ['.card { width: 720px; }', '.card { max-width: 100%; }'],
    correct: 0,
    explanation: 'A fixed width can overflow small screens. Use flexible sizing such as width: min(100%, 720px).',
  },
  'c5-1:c5a1': {
    id: 'c5a8',
    type: 'bug',
    question: 'Scenario: a 300px card becomes 348px wide after padding is added. Which line is the box-model mistake?',
    lines: ['.card { width: 300px; padding: 24px; }', '.card { box-sizing: border-box; }'],
    correct: 0,
    explanation: 'Content-box width does not include padding. Add box-sizing: border-box when the declared width should include padding.',
  },
  'c5-2:c5b1': {
    id: 'c5b8',
    type: 'bug',
    question: 'Scenario: an image stretches outside its card on mobile. Which line is the responsive-media mistake?',
    lines: ['img { width: 600px; }', 'img { max-width: 100%; height: auto; }'],
    correct: 0,
    explanation: 'A fixed image width can overflow. max-width: 100% keeps images inside their containers.',
  },
  'c5-3:c5c1': {
    id: 'c5c8',
    type: 'bug',
    question: 'Scenario: long code text bursts out of a panel and covers nearby content. Which line is the overflow mistake?',
    lines: ['pre { overflow: visible; }', 'pre { overflow-x: auto; }'],
    correct: 0,
    explanation: 'Visible overflow can overlap other UI. Use overflow-x: auto for long code or fixed-format content.',
  },
  'c6-1:c6a1': {
    id: 'c6a8',
    type: 'bug',
    question: 'Scenario: flex items refuse to center vertically. Which line is the alignment mistake?',
    lines: ['.toolbar { display: flex; }', '.toolbar { align-items: middle; }'],
    correct: 1,
    explanation: 'middle is not a valid align-items value. Use align-items: center.',
  },
  'c6-2:c6b1': {
    id: 'c6b8',
    type: 'bug',
    question: 'Scenario: a card grid stays in one column even on desktop. Which line is the grid-template mistake?',
    lines: ['.cards { display: grid; }', '.cards { grid-template-columns: 1fr; }'],
    correct: 1,
    explanation: 'A single 1fr track creates one column. Add responsive tracks, such as repeat(auto-fit, minmax(240px, 1fr)).',
  },
  'c6-3:c6c1': {
    id: 'c6c8',
    type: 'bug',
    question: 'Scenario: an overlay appears behind the card it should cover. Which line is the stacking-context mistake?',
    lines: ['.overlay { position: absolute; z-index: 10; }', '.card { position: relative; z-index: 20; }'],
    correct: 1,
    explanation: 'A higher z-index can keep the card above the overlay. Compare positioned stacking contexts when layering UI.',
  },
  'c7-1:c7a1': {
    id: 'c7a8',
    type: 'bug',
    question: 'Scenario: desktop styles apply on phones and make the layout too wide. Which line is the media-query mistake?',
    lines: ['@media (min-width: 320px) { .layout { grid-template-columns: 1fr 1fr; } }', '@media (min-width: 900px) { .layout { grid-template-columns: 1fr 1fr; } }'],
    correct: 0,
    explanation: 'A 320px min-width query affects most phones. Put desktop layout changes behind a larger breakpoint.',
  },
  'c7-2:c7b1': {
    id: 'c7b8',
    type: 'bug',
    question: 'Scenario: a hero image file returns 404 after deployment. Which line is the background-path mistake?',
    lines: ['.hero { background-image: url("C:/Users/Jenna/hero.jpg"); }', '.hero { background-image: url("./images/hero.jpg"); }'],
    correct: 0,
    explanation: 'Local disk paths do not work on deployed sites. Use a project-relative URL that ships with the app.',
  },
  'c7-3:c7c1': {
    id: 'c7c8',
    type: 'bug',
    question: 'Scenario: a gradient makes button text unreadable. Which line is the contrast mistake?',
    lines: ['.button { background: linear-gradient(#fff, #eee); color: #f8f8f8; }', '.button { color: #111; }'],
    correct: 0,
    explanation: 'Low-contrast text is hard to read. Choose text and background colors that meet accessible contrast.',
  },
  'c8-1:c8a1': {
    id: 'c8a8',
    type: 'bug',
    question: 'Scenario: a quick fix uses !important and now theme classes cannot override it. Which line is the cascade mistake?',
    lines: ['.card { color: red !important; }', '.theme-dark .card { color: white; }'],
    correct: 0,
    explanation: '!important should be rare. It can block normal theme overrides and make the cascade harder to reason about.',
  },
  'c8-2:c8b1': {
    id: 'c8b8',
    type: 'bug',
    question: 'Scenario: a later utility class does not win against a more specific card rule. Which line explains the specificity mistake?',
    lines: ['.dashboard .card h2 { color: navy; }', '.text-red { color: red; }'],
    correct: 0,
    explanation: 'The longer descendant selector has higher specificity than the utility class, so source order alone may not help.',
  },
  'c8-3:c8c1': {
    id: 'c8c8',
    type: 'bug',
    question: 'Scenario: resetting every element removes visible focus outlines. Which line is the reset mistake?',
    lines: ['* { outline: none; }', ':focus-visible { outline: 2px solid currentColor; }'],
    correct: 0,
    explanation: 'Do not remove focus outlines globally. Keyboard users need a visible focus indicator.',
  },
  'c9-1:c9a1': {
    id: 'c9a8',
    type: 'bug',
    question: 'Scenario: keyboard users cannot tell which link is active. Which line is the focus-state mistake?',
    lines: ['a:focus { outline: none; }', 'a:focus-visible { outline: 2px solid #2563eb; }'],
    correct: 0,
    explanation: 'Removing focus without a replacement hurts accessibility. Provide a clear focus-visible style.',
  },
  'c9-2:c9b1': {
    id: 'c9b8',
    type: 'bug',
    question: 'Scenario: a custom list loses its bullets and no longer reads like a list visually. Which line is the list-style mistake?',
    lines: ['ul { list-style: none; padding-left: 0; }', '.nav-list { list-style: none; }'],
    correct: 0,
    explanation: 'A global ul reset removes list affordances everywhere. Scope list-style removal to navigation or components that need it.',
  },
  'c9-3:c9c1': {
    id: 'c9c8',
    type: 'bug',
    question: 'Scenario: a BEM modifier never applies to the card title. Which line is the naming mistake?',
    lines: ['.card-title--featured { color: gold; }', '.card__title--featured { color: gold; }'],
    correct: 0,
    explanation: 'BEM element modifiers should keep the block__element--modifier shape, such as card__title--featured.',
  },
  'c10-1:c10a1': {
    id: 'c10a8',
    type: 'bug',
    question: 'Scenario: users who prefer reduced motion still see a spinning animation. Which line is the motion-accessibility mistake?',
    lines: ['.spinner { animation: spin 1s linear infinite; }', '@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }'],
    correct: 0,
    explanation: 'Motion-heavy effects should respect prefers-reduced-motion with a reduced or disabled animation path.',
  },
  'c10-2:c10b1': {
    id: 'c10b8',
    type: 'bug',
    question: 'Scenario: DevTools shows a rule crossed out, but the team keeps editing the wrong selector. Which line is the debugging mistake?',
    lines: ['change random values until the page looks right', 'inspect computed styles and the winning selector in DevTools'],
    correct: 0,
    explanation: 'Use DevTools to see which declaration wins and why. Random edits hide the real cascade or specificity issue.',
  },
  'c10-3:c10c1': {
    id: 'c10c8',
    type: 'bug',
    question: 'Scenario: a production stylesheet ships with several unused rules copied from experiments. Which line is the cleanup mistake?',
    lines: ['leave unused prototype classes in the final CSS', 'remove unused rules after verifying they are not referenced'],
    correct: 0,
    explanation: 'Unused CSS adds maintenance noise and can accidentally affect future markup. Clean it up before launch.',
  },
  'css-1-5:css15a1': {
    id: 'css15a8',
    type: 'bug',
    question: 'Scenario: a design uses five unrelated font families and feels inconsistent. Which line is the typography-system mistake?',
    lines: ['assign a new font to every card and button', 'choose a small type scale and reuse font roles'],
    correct: 0,
    explanation: 'A type system should be consistent. Reuse a small set of font roles and sizes for predictable hierarchy.',
  },
  'css-2-6:css26a1': {
    id: 'css26a8',
    type: 'bug',
    question: 'Scenario: a responsive component leaves a huge blank gap between cards on wide screens. Which line is the layout mistake?',
    lines: ['grid-template-columns: repeat(2, 1fr); max-width: none;', 'grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));'],
    correct: 0,
    explanation: 'A fixed two-column layout can waste space on wide screens. Responsive tracks adapt better to available width.',
  },
  'css-4-4:css44a1': {
    id: 'css44a8',
    type: 'bug',
    question: 'Scenario: a hover animation causes layout shift in nearby content. Which line is the transform mistake?',
    lines: ['.card:hover { margin-top: -8px; }', '.card:hover { transform: translateY(-8px); }'],
    correct: 0,
    explanation: 'Animating margin changes layout. transform moves the element visually without reflowing surrounding content.',
  },
  'css-4-5:css45a1': {
    id: 'css45a8',
    type: 'bug',
    question: 'Scenario: glassmorphism text becomes hard to read over busy images. Which line is the visual-effect mistake?',
    lines: ['use transparent panels without contrast safeguards', 'add a readable background layer and test contrast'],
    correct: 0,
    explanation: 'Advanced effects should never undermine readability. Add contrast, fallback backgrounds, and test text legibility.',
  },
});

export const CSS_QUIZ_QUALITY_TARGET_KEYS = Object.freeze(
  Object.keys(CSS_QUIZ_QUALITY_ITEMS),
);

export const CSS_QUIZ_QUALITY_ITEM_IDS = Object.freeze(
  Object.values(CSS_QUIZ_QUALITY_ITEMS).map((item) => item.id),
);

export function getCssQuizQualityKey(quiz = {}) {
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  return `${quiz.lessonId}:${questions[0]?.id || ''}`;
}

export function applyCssQuizQualityItems(quizzes = []) {
  return quizzes.map((quiz) => {
    const qualityItem = CSS_QUIZ_QUALITY_ITEMS[getCssQuizQualityKey(quiz)];
    if (!qualityItem) return quiz;

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (questions.some((question) => question?.id === qualityItem.id)) return quiz;

    return {
      ...quiz,
      questions: [...questions, qualityItem],
    };
  });
}
