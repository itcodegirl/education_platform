export const module = { id: 14, emoji: '🔍', title: 'Meta Tags & SEO Basics', tagline: 'Get found. Get clicks.', difficulty: 'intermediate', lessons: [
    { id: 'h14-1', scaffolding: 'requirements',
      prereqs: ['h13-2'], title: 'SEO-Friendly HTML & Open Graph',
      difficulty: 'beginner', duration: '12 min',
      concepts: [
        '<title> should be 50-60 characters and describe the page specifically.',
        'meta description (150-160 chars) shows in search result snippets.',
        'Proper heading hierarchy (one h1, logical h2-h6) helps search engines understand structure.',
        'Open Graph tags control how your page looks when shared on Facebook/LinkedIn.',
        'Twitter Card tags control how your page looks when shared on Twitter/X.',
        'canonical URL tells search engines which version of a page is the "real" one.',
      ],
      code: `<head>\n    <title>Learn HTML Free | CodeHerWay</title>\n    <meta name="description"\n          content="Free HTML course for women in tech." />\n    <link rel="canonical"\n          href="https://codeherway.com/html" />\n\n    <!-- Open Graph -->\n    <meta property="og:title"\n          content="Learn HTML Free" />\n    <meta property="og:description"\n          content="Master HTML from zero." />\n    <meta property="og:image"\n          content="https://codeherway.com/og.jpg" />\n    <meta property="og:type" content="website" />\n\n    <!-- Twitter Card -->\n    <meta name="twitter:card"\n          content="summary_large_image" />\n\n    <link rel="icon" href="/favicon.ico" />\n</head>`,
      output: 'A fully SEO-optimized <head> with title, description, Open Graph, Twitter Card, and favicon.',
      tasks: [
        'Write a <title> under 60 characters for your portfolio.',
        'Add a meta description under 160 characters.',
        'Add Open Graph tags so your page previews nicely on social media.',
      ],
      challenge: 'Write a complete <head> section with title, description, canonical, OG tags, Twitter Card, and favicon.',
      devFession: 'I shared my portfolio on LinkedIn and it showed "localhost:3000" as the preview. Open Graph would have fixed that.' },
  ]};



