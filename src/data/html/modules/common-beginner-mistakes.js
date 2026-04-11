export const module = { id: 17, emoji: '⚠️', title: 'Common Beginner Mistakes', tagline: 'Learn from the mistakes everyone makes.', difficulty: 'advanced', lessons: [
    { id: 'h17-1', scaffolding: 'requirements',
      prereqs: ['h16-1'], title: 'The Mistakes That Bite You',
      difficulty: 'beginner', duration: '10 min',
      concepts: [
        'Forgetting closing tags — the browser guesses, and it guesses wrong.',
        'Incorrect nesting: <p><div></div></p> is invalid — block elements can\'t go inside inline.',
        'Using multiple <h1> tags — there should be only one per page.',
        'Using <div> for everything instead of semantic elements.',
        'Forgetting alt attributes on images.',
        'Not validating your code — the W3C Validator catches things browsers silently ignore.',
      ],
      code: `<!-- WRONG: forgotten closing tag -->\n<p>First paragraph\n<p>Second paragraph\n\n<!-- RIGHT -->\n<p>First paragraph</p>\n<p>Second paragraph</p>\n\n<!-- WRONG: bad nesting -->\n<p><div>Block inside inline</div></p>\n\n<!-- RIGHT -->\n<div><p>Inline inside block</p></div>\n\n<!-- WRONG: multiple h1 -->\n<h1>Title</h1>\n<h1>Another title</h1>\n\n<!-- RIGHT: one h1, use h2 for others -->\n<h1>Main Title</h1>\n<h2>Section Title</h2>`,
      output: 'Common mistakes side by side with their corrections.',
      tasks: [
        'Find and fix 3 nesting errors in your code.',
        'Check that you have exactly one <h1> per page.',
        'Run your HTML through the W3C Validator and fix every warning.',
      ],
      challenge: 'Write intentionally broken HTML with 5 different mistakes, then fix all of them.',
      devFession: 'I nested a <div> inside a <p> and spent an hour debugging a layout that "should have worked." HTML said no.' },
  ]};
