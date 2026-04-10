export const module = { id: 18, emoji: '✅', title: 'Validation & Best Practices', tagline: 'Code your future self will love.', difficulty: 'advanced', lessons: [
    { id: 'h18-1',
      prereqs: ['h17-1'], title: 'Clean Code & W3C Validation',
      difficulty: 'beginner', duration: '10 min',
      concepts: [
        'Use the W3C Validator (validator.w3.org) to check your HTML for errors.',
        'Consistent indentation (2 or 4 spaces) makes code readable.',
        'Use lowercase for tag names and attributes — always.',
        'Use meaningful class names: .card-title not .ct or .style1.',
        'Add comments to separate major sections of your HTML.',
        'Remove unused code — commented-out HTML is clutter.',
      ],
      code: `<!-- BAD -->\n<DIV CLASS='main'><P>text\n<img src=photo.jpg>\n\n<!-- GOOD -->\n<div class="main">\n    <p>Properly structured.</p>\n    <img src="photo.jpg"\n         alt="Descriptive text" />\n</div>\n\n<!-- Section comments -->\n<!-- Header -->\n<header>...</header>\n\n<!-- Main Content -->\n<main>...</main>\n\n<!-- Footer -->\n<footer>...</footer>`,
      output: 'Clean, validated HTML vs messy, broken HTML.',
      tasks: [
        'Run your latest project through the W3C Validator.',
        'Fix every error and warning it reports.',
        'Reformat your HTML with consistent indentation.',
      ],
      challenge: 'Take your messiest HTML file, validate it, fix all errors, and clean up the formatting.',
      devFession: 'I ran the validator and it returned 47 warnings. Forty. Seven. Enable "Format on Save" in VS Code. Please.' },
  ]};
