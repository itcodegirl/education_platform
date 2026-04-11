export const module = { id: 16, emoji: '🧪', title: 'Developer Tools Deep Dive', tagline: 'Your best debugging friend.', difficulty: 'advanced', lessons: [
    { id: 'h16-1', scaffolding: 'requirements',
      prereqs: ['h15-1'], title: 'Inspecting, Editing & Debugging',
      difficulty: 'beginner', duration: '12 min',
      concepts: [
        'The Elements panel shows the live DOM tree — click any element to see its CSS.',
        'You can edit HTML, CSS, and text directly in the panel — changes are temporary.',
        'The box model diagram shows padding, border, and margin visually.',
        'The Network tab shows every file loaded: HTML, CSS, JS, images, fonts.',
        'The Console tab shows errors — read the error message and line number first.',
      ],
      code: `<!-- Practice page for DevTools -->\n<div class="debug-me" style="padding: 20px;\n     margin: 10px; border: 2px solid red;">\n    <h2>Inspect this element</h2>\n    <p>Look at the box model in DevTools.</p>\n    <p class="hidden-bug">This text might\n       have a CSS issue.</p>\n</div>`,
      output: 'A styled element to inspect — practice viewing the box model and computed styles.',
      tasks: [
        'Inspect an element and view its computed CSS values.',
        'Find and read the box model diagram in the Elements panel.',
        'Check the Console for errors on any page you\'ve built.',
        'Use the Network tab to see what files are loading.',
      ],
      challenge: 'Introduce a bug in your CSS on purpose, then find and fix it using only DevTools.',
      devFession: 'DevTools didn\'t judge me. It simply revealed that I had created the problem myself.' },
  ]};
