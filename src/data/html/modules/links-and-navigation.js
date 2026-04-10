export const module = { id: 6, emoji: '🔗', title: 'Links & Navigation', tagline: 'Connect the web.', difficulty: 'beginner', lessons: [
    { id: 'h6-1', title: 'Anchor Tags, URLs & Link Types',
      prereqs: ['h5-3'],
      difficulty: 'beginner', duration: '12 min',
      concepts: [
        '<a href="..."> creates a hyperlink — the foundation of the web.',
        'Absolute URLs point to a full address (https://...).',
        'Relative URLs point to files in your own project (./about.html).',
        'target="_blank" opens links in a new tab.',
        'Anchor links (#section) jump to elements with matching IDs on the same page.',
        'mailto: opens an email client, tel: triggers a phone call on mobile.',
      ],
      code: `<!-- External link -->\n<a href="https://example.com" target="_blank">\n    Visit Example\n</a>\n\n<!-- Relative link -->\n<a href="./about.html">About Us</a>\n\n<!-- Anchor link -->\n<a href="#contact">Jump to Contact</a>\n<section id="contact">\n    <h2>Contact Us</h2>\n</section>\n\n<!-- Email & phone -->\n<a href="mailto:hello@codeherway.com">Email Us</a>\n<a href="tel:+1234567890">Call Us</a>`,
      output: 'External links, internal navigation, anchor jumps, email and phone links.',
      tasks: [
        'Create an external link that opens in a new tab.',
        'Create a relative link to another HTML file in your project.',
        'Create an anchor link that jumps to a section with an ID.',
        'Create a mailto: link.',
      ],
      challenge: 'Build a simple navigation bar with 4 links: Home, About, Contact (anchor), and an external resource.',
      devFession: 'I forgot target="_blank" and kept navigating away from my own site during testing.' },
  ]};
