export const module = { id: 15, emoji: '📂', title: 'File Structure & Organization', tagline: 'A clean project is a maintainable project.', difficulty: 'advanced', lessons: [
    { id: 'h15-1',
      prereqs: ['h14-1'], title: 'Project Folders & File Linking',
      difficulty: 'beginner', duration: '10 min',
      concepts: [
        'Every project needs a clear folder structure: html at root, css/, js/, images/ in folders.',
        'index.html is the homepage — browsers look for it by default.',
        'CSS links go in <head>: <link rel="stylesheet" href="css/styles.css">.',
        'JS links go before </body> or in <head> with defer attribute.',
        'Relative paths (./css/styles.css) are better than absolute for project files.',
      ],
      code: `<!-- Project structure -->\n<!--\nmy-project/\n├── index.html\n├── about.html\n├── css/\n│   └── styles.css\n├── js/\n│   └── app.js\n└── images/\n    ├── hero.jpg\n    └── logo.svg\n-->\n\n<!-- Linking CSS -->\n<link rel="stylesheet" href="css/styles.css">\n\n<!-- Linking JS -->\n<script src="js/app.js" defer></script>\n\n<!-- Linking images -->\n<img src="images/hero.jpg" alt="Hero banner" />`,
      output: 'A properly organized project with linked CSS, JS, and image files.',
      tasks: [
        'Create the folder structure shown above.',
        'Link a CSS file from the css/ folder.',
        'Link a JS file with defer from the js/ folder.',
        'Reference an image from the images/ folder.',
      ],
      challenge: 'Set up a project from scratch with index.html, about.html, shared CSS, shared JS, and an images folder.',
      devFession: 'All my files were in one folder. index.html, style.css, script.js, photo1.jpg, photo2.jpg... 47 files. One folder.' },
  ]};
