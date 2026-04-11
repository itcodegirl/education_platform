export const module = {
  id: 111,
  emoji: '🎨',
  title: 'Styling from Scratch',
  tagline: 'Turn plain HTML into something beautiful.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'css-lesson-01',
      title: 'Turn Your Plain HTML Into Something You\'d Actually Show People',
      prereqs: [],
      difficulty: 'beginner',
      duration: '18 min',
      metadata: { estimatedTime: 18, difficulty: 'beginner', conceptsCount: 3, tasksCount: 3 },
      hook: {
        accomplishments: [
          'Change your webpage\'s colors and fonts with actual CSS code',
          'Link a real stylesheet file (the professional way)',
          'See your HTML transform from 1995 to today',
        ],
      },
      do: {
        title: 'Add color to your page RIGHT NOW',
        steps: [
          'Open VS Code (or go to CodePen.io)',
          'Create a new file called first-style.html',
          'Copy and paste the code below exactly as shown',
          'Save the file',
          'Double-click the file to open it in your browser',
          'You should see a soft blue background, purple heading, and dark text',
        ],
        code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Styled Page</title>\n  <style>\n    body {\n      background-color: #F0F4F8;\n    }\n    \n    h1 {\n      color: #6C63FF;\n      font-size: 48px;\n    }\n    \n    p {\n      color: #2D3748;\n      font-size: 20px;\n    }\n  </style>\n</head>\n<body>\n  <h1>I Just Styled This!</h1>\n  <p>This is no longer plain HTML. This has style.</p>\n</body>\n</html>',
        result: 'You just added CSS to an HTML page and changed how it looks!',
        proofRequired: 'your styled page with the purple heading',
      },
      understand: {
        concepts: [
          {
            name: 'CSS = Cascading Style Sheets',
            definition: 'CSS controls how things LOOK. HTML creates the structure (headings, paragraphs, buttons). CSS makes those things pretty, colorful, spaced out, and positioned.',
            analogy: 'HTML is the bones of a house. CSS is the paint, furniture, and interior design.',
          },
          {
            name: 'The <style> tag',
            definition: 'This is where CSS lives inside an HTML file. Everything between <style> and </style> is CSS code, not HTML.',
            analogy: 'A special room in your house just for storing paint and decorating supplies. It\'s part of the house (HTML file) but contains different materials (CSS).',
          },
          {
            name: 'CSS Syntax: selector { property: value; }',
            definition: 'Every CSS rule follows this pattern: selector (what to style) + property (what aspect to change) + value (what to change it to). Example: h1 { color: #6C63FF; }',
            analogy: 'Like a recipe instruction: ingredient (selector), cooking method (property), specific measurement (value). \'Eggs { temperature: 350\u00B0F; }\'',
          },
        ],
        keyTakeaway: 'HTML creates elements. CSS makes them look how you want.',
      },
      build: {
        goal: 'Change the colors to ones YOU like',
        codeComparison: {
          old: 'body {\n  background-color: #F0F4F8;\n}\n\nh1 {\n  color: #6C63FF;\n}',
          new: 'body {\n  background-color: #FFF5F5;  /* Soft pink background */\n}\n\nh1 {\n  color: #E53E3E;  /* Red heading */\n}',
        },
        hint: 'Color codes always start with # and have 6 characters. Make sure to keep the # symbol! Google \'color picker\' to choose your own hex codes.',
      },
      challenge: {
        title: 'Create a Professional \'About Me\' Card',
        mission: 'Build a styled About Me section that looks professional and uses CSS you just learned.',
        requirements: [
          'Light or dark background color',
          'Large heading with your name in a custom color',
          'At least 3 paragraphs about yourself in a readable color',
          'Different font sizes for heading vs paragraphs',
          'All styling in a <style> tag',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>About Me</title>\n  <style>\n    /* Add your CSS here */\n  </style>\n</head>\n<body>\n  <h1>Your Name Here</h1>\n  <p>Write about yourself...</p>\n  <p>Add more paragraphs...</p>\n  <p>Make it yours...</p>\n</body>\n</html>',
        bonusChallenge: 'Add styling for an h2 heading and create subsections in your About Me!',
      },
      summary: {
        capabilities: [
          'Write CSS inside a <style> tag',
          'Use selectors to target HTML elements (body, h1, p)',
          'Change colors with color and background-color',
          'Change font sizes with font-size',
          'Understand the CSS syntax: selector { property: value; }',
        ],
      },
      bridge: {
        preview: 'Right now, your CSS lives inside your HTML file in a <style> tag. That works for learning, but professionals don\'t do it this way. Why? Because if you have 10 pages on your website, you\'d have to copy/paste the same CSS 10 times. In the next lesson, you\'ll learn how to put your CSS in a separate file (the professional way) and link that file to multiple HTML pages. Change your entire website\'s style by editing just ONE file. This is when you start thinking like a real developer.',
        nextLessonId: 'css-lesson-02',
      },
    },
  ],
};
