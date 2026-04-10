export const module = { id: 8, emoji: '📋', title: 'Lists', tagline: 'Structure your data.', difficulty: 'intermediate', lessons: [
    { id: 'h8-1', title: 'All Three List Types',
      prereqs: ['h7-2'],
      difficulty: 'beginner', duration: '10 min',
      concepts: [
        '<ul> creates unordered (bullet) lists — use for items with no specific order.',
        '<ol> creates ordered (numbered) lists — use for steps, rankings, sequences.',
        '<dl> creates definition lists with <dt> (term) and <dd> (definition) pairs.',
        'Lists can be nested inside other lists.',
      ],
      code: `<!-- Unordered -->\n<ul>\n    <li>HTML</li>\n    <li>CSS</li>\n    <li>JavaScript</li>\n</ul>\n\n<!-- Ordered -->\n<ol>\n    <li>Learn HTML</li>\n    <li>Learn CSS</li>\n    <li>Learn JavaScript</li>\n</ol>\n\n<!-- Definition -->\n<dl>\n    <dt>HTML</dt>\n    <dd>HyperText Markup Language</dd>\n    <dt>CSS</dt>\n    <dd>Cascading Style Sheets</dd>\n</dl>\n\n<!-- Nested -->\n<ul>\n    <li>Frontend\n        <ul>\n            <li>HTML</li>\n            <li>CSS</li>\n        </ul>\n    </li>\n</ul>`,
      output: 'Bullet list, numbered list, definition list, and a nested list.',
      tasks: [
        'Create an unordered list of your favorite tools.',
        'Create an ordered list of steps to make coffee.',
        'Create a definition list for 3 web terms.',
        'Nest a list inside another list.',
      ],
      challenge: 'Build a glossary page using a definition list with at least 5 terms.',
      devFession: 'I tried to make a list without <li> tags. Just bare text inside <ul>. The browser was confused. So was I.' },
  ]};
