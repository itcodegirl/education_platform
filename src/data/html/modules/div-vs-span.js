export const module = { id: 11, emoji: '🧩', title: 'Div vs Span', tagline: 'Know when to use generic containers.', difficulty: 'intermediate', lessons: [
    { id: 'h11-1', scaffolding: 'starter', title: 'Block vs Inline Containers',
      prereqs: ['h10-2'],
      difficulty: 'beginner', duration: '8 min',
      concepts: [
        '<div> is a block-level container — it takes the full width and starts on a new line.',
        '<span> is an inline container — it only takes as much width as its content.',
        'Use semantic elements first (section, article, nav). Use div/span only when nothing else fits.',
        'div and span have no meaning — they\'re purely for grouping and styling.',
      ],
      code: `<!-- div is block-level -->\n<div class="card">\n    <h3>Card Title</h3>\n    <p>Card content goes here.</p>\n</div>\n\n<!-- span is inline -->\n<p>The price is <span class="price">$29.99</span></p>\n<p>Status: <span class="badge">Active</span></p>\n\n<!-- WRONG: div for everything -->\n<div class="nav">Don't do this</div>\n\n<!-- RIGHT: semantic element -->\n<nav>Do this instead</nav>`,
      output: 'Div wraps blocks. Span wraps inline text. Semantic elements are better when available.',
      tasks: [
        'Create a card component using a div.',
        'Highlight a price inside a paragraph using a span.',
        'Replace 3 unnecessary divs with semantic elements.',
      ],
      challenge: 'Build a pricing card using div for the container and span for inline badges — but use semantic elements everywhere else.',
      devFession: 'My entire HTML was divs. Div div div. I called it "div-driven development." Don\'t be like me.' },
  ]};
