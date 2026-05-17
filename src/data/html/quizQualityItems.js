export const HTML_QUIZ_QUALITY_ITEMS = Object.freeze({
  'h2-1:h3a': {
    id: 'h3h',
    type: 'bug',
    question: 'Scenario: a beginner opens index.html in VS Code but sees plain text in the browser. Which line is the setup mistake?',
    lines: ['save the file as index', 'open it with Live Server', 'check the browser tab'],
    correct: 0,
    explanation: 'HTML files need a valid .html extension. A file named index without .html may not be treated as a web page.',
  },
  'h2-2:h4a': {
    id: 'h4h',
    type: 'bug',
    question: 'Scenario: DevTools changes look fixed, but the issue comes back after refresh. Which line is the debugging mistake?',
    lines: ['edit the element in DevTools', 'refresh the page', 'assume the source file was saved'],
    correct: 2,
    explanation: 'DevTools edits are temporary. Copy the real fix back into the project file if it should survive refresh.',
  },
  'h3-1:h5a': {
    id: 'h5h',
    type: 'bug',
    question: 'Scenario: a page renders in quirks mode and spacing looks wrong. Which line is the document-structure mistake?',
    lines: ['<html lang="en">', '<head>', '  <title>Portfolio</title>', '</head>'],
    correct: 0,
    explanation: 'The document is missing <!DOCTYPE html> before the html element, so the browser may use quirks mode.',
  },
  'h3-2:h6a': {
    id: 'h6h',
    type: 'bug',
    question: 'Scenario: a phone preview loads zoomed out and tiny. Which line is the responsive-meta mistake?',
    lines: ['<meta charset="UTF-8">', '<title>Starter Page</title>', '<link rel="stylesheet" href="style.css">'],
    correct: 1,
    explanation: 'A mobile-ready page needs a viewport meta tag in the head, usually width=device-width, initial-scale=1.0.',
  },
  'h4-1:h7a': {
    id: 'h7h',
    type: 'bug',
    question: 'Scenario: a browser splits a paragraph in a strange place. Which line is the nesting mistake?',
    lines: ['<p>', '  <div>Shipping details</div>', '</p>'],
    correct: 1,
    explanation: 'A div should not be nested inside a paragraph. Use a div or section wrapper around separate paragraphs instead.',
  },
  'h4-2:h8a': {
    id: 'h8h',
    type: 'bug',
    question: 'Scenario: clicking a link does nothing because its destination is not recognized. Which line is the attribute mistake?',
    lines: ['<a href"about.html">About</a>', '<img src="team.jpg" alt="Team photo">'],
    correct: 0,
    explanation: 'The href attribute is missing an equals sign. It should be href="about.html".',
  },
  'h5-1:h9a': {
    id: 'h9h',
    type: 'bug',
    question: 'Scenario: a screen reader outline jumps from the page title to a small subsection. Which line is the heading-order mistake?',
    lines: ['<h1>About CodeHerWay</h1>', '<h3>Our programs</h3>', '<p>Learn by building.</p>'],
    correct: 1,
    explanation: 'Heading levels should not skip from h1 to h3. Add an h2 for the section so the document outline stays logical.',
  },
  'h5-2:h10a': {
    id: 'h10h',
    type: 'bug',
    question: 'Scenario: important warning text is only visually bold, but assistive tech misses the emphasis. Which line is the semantic-text mistake?',
    lines: ['<b>Submit before Friday</b>', '<p>Late work may not be reviewed.</p>'],
    correct: 0,
    explanation: 'Use <strong> for meaningful importance. <b> only changes visual weight and does not communicate the same semantics.',
  },
  'h5-3:h11a': {
    id: 'h11h',
    type: 'bug',
    question: 'Scenario: example code disappears because the browser treats it as a real tag. Which line is the entity mistake?',
    lines: ['<p>Use <section> for a page region.</p>', '<p>Then add a heading.</p>'],
    correct: 0,
    explanation: 'Literal angle brackets in text should be escaped, such as &lt;section&gt;, so the browser displays them as text.',
  },
  'h6-1:h12a': {
    id: 'h12h',
    type: 'bug',
    question: 'Scenario: the About link works locally but breaks after moving pages into a folder. Which line is the path mistake?',
    lines: ['<a href="C:/Users/Jenna/site/about.html">About</a>', '<a href="./contact.html">Contact</a>'],
    correct: 0,
    explanation: 'Local absolute disk paths will not work after deployment. Use project-relative links like ./about.html.',
  },
  'h7-1:h13a': {
    id: 'h13h',
    type: 'bug',
    question: 'Scenario: a screen reader cannot understand the page layout. Which line is the semantic-structure mistake?',
    lines: ['<div class="nav">Home About Contact</div>', '<main><h1>Welcome</h1></main>'],
    correct: 0,
    explanation: 'Navigation should use semantic elements such as <nav> with links. A plain div hides the landmark meaning.',
  },
  'h7-2:h14a': {
    id: 'h14h',
    type: 'bug',
    question: 'Scenario: a profile photo is announced as a file name instead of useful context. Which line is the image-alt mistake?',
    lines: ['<img src="jenna-headshot.jpg" alt="">', '<h1>Jenna Lee</h1>'],
    correct: 0,
    explanation: 'Informative images need descriptive alt text. Empty alt is only for decorative images.',
  },
  'h8-1:h15a': {
    id: 'h15h',
    type: 'bug',
    question: 'Scenario: an unordered feature list is read as one paragraph. Which line is the list-structure mistake?',
    lines: ['<p>Mentorship</p>', '<p>Projects</p>', '<p>Interview prep</p>'],
    correct: 0,
    explanation: 'Related list items should be grouped in a ul or ol with li elements so the structure is clear.',
  },
  'h9-1:h16a': {
    id: 'h16h',
    type: 'bug',
    question: 'Scenario: a page has a top menu but keyboard users cannot tell it is navigation. Which line is the navigation mistake?',
    lines: ['<div class="menu"><a href="/">Home</a></div>', '<main><h1>Programs</h1></main>'],
    correct: 0,
    explanation: 'Use a <nav> landmark for site navigation so assistive technology can identify it.',
  },
  'h10-1:h17a': {
    id: 'h17h',
    type: 'bug',
    question: 'Scenario: a blog article is wrapped in a generic container, making the page harder to scan. Which line is the landmark mistake?',
    lines: ['<div class="article"><h2>My Story</h2><p>...</p></div>', '<aside>Related links</aside>'],
    correct: 0,
    explanation: 'Use semantic article or section elements when content is a standalone article or clear page region.',
  },
  'h10-2:h18a': {
    id: 'h18h',
    type: 'bug',
    question: 'Scenario: a footer link list is read as unrelated text. Which line is the footer-structure mistake?',
    lines: ['<footer><span>Privacy</span> <span>Terms</span></footer>', '<main><h1>Home</h1></main>'],
    correct: 0,
    explanation: 'Footer links should be real anchors, often grouped in a list or nav, so users can navigate them.',
  },
  'h11-1:h19a': {
    id: 'h19h',
    type: 'bug',
    question: 'Scenario: styling fails because every card uses the same unique identifier. Which line is the id mistake?',
    lines: ['<article id="card">First</article>', '<article id="card">Second</article>'],
    correct: 1,
    explanation: 'IDs must be unique on a page. Use a reusable class for repeated card styling.',
  },
  'h12-1:h20a': {
    id: 'h20h',
    type: 'bug',
    question: 'Scenario: clicking the Name label does not focus the input. Which line is the label mistake?',
    lines: ['<label>Name</label>', '<input id="name" type="text">'],
    correct: 0,
    explanation: 'Connect the label with for="name" so the label and input are programmatically linked.',
  },
  'h12-2:h21a': {
    id: 'h21h',
    type: 'bug',
    question: 'Scenario: a form submits successfully even when the email field is blank. Which line is the validation mistake?',
    lines: ['<input type="email" name="email">', '<button type="submit">Join</button>'],
    correct: 0,
    explanation: 'If email is required, add the required attribute and keep server-side validation too.',
  },
  'h12-3:h22a': {
    id: 'h22h',
    type: 'bug',
    question: 'Scenario: a form sends data to the wrong endpoint. Which line is the form-attribute mistake?',
    lines: ['<form method="post">', '  <input name="email">', '</form>'],
    correct: 0,
    explanation: 'A production form needs an intentional action or platform integration. Without it, the browser posts to the current URL.',
  },
  'h13-1:h23a': {
    id: 'h23h',
    type: 'bug',
    question: 'Scenario: a video has audio instructions but no alternative for learners who cannot hear it. Which line is the media-accessibility mistake?',
    lines: ['<video controls src="lesson.mp4"></video>', '<p>Watch the demo above.</p>'],
    correct: 0,
    explanation: 'Instructional video should include captions or a transcript so the information is available without audio.',
  },
  'h13-2:h24a': {
    id: 'h24h',
    type: 'bug',
    question: 'Scenario: an icon-only button is announced as button with no name. Which line is the ARIA-label mistake?',
    lines: ['<button><span aria-hidden="true">X</span></button>', '<p>Close the modal</p>'],
    correct: 0,
    explanation: 'Icon-only buttons need an accessible name, such as aria-label="Close modal".',
  },
  'h14-1:h25a': {
    id: 'h25h',
    type: 'bug',
    question: 'Scenario: every search result shows the same vague browser-tab title. Which line is the SEO metadata mistake?',
    lines: ['<title>Home</title>', '<meta name="description" content="Learn HTML basics">'],
    correct: 0,
    explanation: 'The title should be specific to the page so users and search engines understand what the page is about.',
  },
  'h15-1:h26a': {
    id: 'h26h',
    type: 'bug',
    question: 'Scenario: a CSS file returns 404 after deployment. Which line is the folder-path mistake?',
    lines: ['<link rel="stylesheet" href="styles.css">', '<!-- actual file is css/styles.css -->'],
    correct: 0,
    explanation: 'The href must match the project folder structure. Use ./css/styles.css when the file lives in a css folder.',
  },
  'h16-1:h27a': {
    id: 'h27h',
    type: 'bug',
    question: 'Scenario: a missing image is hard to debug because the wrong tool is open. Which line is the DevTools workflow mistake?',
    lines: ['check only the Elements panel', 'open the Network tab and look for the image request'],
    correct: 0,
    explanation: 'The Network tab shows whether files load or 404. Elements alone does not show the request status.',
  },
  'h17-1:h28a': {
    id: 'h28h',
    type: 'bug',
    question: 'Scenario: a validation report flags repeated headings and missing alt text. Which line is the fix-priority mistake?',
    lines: ['ignore it because the browser rendered the page', 'fix the structural and accessibility errors before launch'],
    correct: 0,
    explanation: 'Browsers tolerate invalid HTML, but production pages should fix validation and accessibility issues before launch.',
  },
  'h18-1:h29a': {
    id: 'h29h',
    type: 'bug',
    question: 'Scenario: a teammate cannot review the page because the markup is hard to follow. Which line is the code-quality mistake?',
    lines: ['<section><div><h2>Projects</h2><p>...</p></div></section>', '<!-- no indentation or meaningful comments around complex regions -->'],
    correct: 1,
    explanation: 'Consistent formatting and helpful structure make HTML easier to review, debug, and maintain.',
  },
  'h19-1:h30a': {
    id: 'h30h',
    type: 'bug',
    question: 'Scenario: JavaScript reads a product id as 421 instead of 43. Which line is the data-attribute mistake?',
    lines: ['const quantity = card.dataset.quantity;', 'const total = quantity + 1;', 'render(total);'],
    correct: 1,
    explanation: 'dataset values are strings. Convert numeric data with Number(quantity) before doing math.',
  },
  'h19-2:h31a': {
    id: 'h31h',
    type: 'bug',
    question: 'Scenario: user comments are inserted into a template with unsafe HTML. Which line is the template-security mistake?',
    lines: ['clone.querySelector(".comment").innerHTML = userComment;', 'list.append(clone);'],
    correct: 0,
    explanation: 'Do not put raw user content into innerHTML. Use textContent or sanitize trusted markup first.',
  },
  'h20-1:h32a': {
    id: 'h32h',
    type: 'bug',
    question: 'Scenario: JavaScript only updates the first repeated card. Which line is the selector mistake?',
    lines: ['const card = document.getElementById("card");', '<article id="card">One</article>', '<article id="card">Two</article>'],
    correct: 0,
    explanation: 'IDs must be unique. Repeated cards should use a class and querySelectorAll when JavaScript needs all of them.',
  },
  'h20-2:h33a': {
    id: 'h33h',
    type: 'bug',
    question: 'Scenario: a portfolio page is deployed before links and accessibility are checked. Which line is the launch-readiness mistake?',
    lines: ['publish after only checking the homepage', 'validate HTML, test links, and run an accessibility pass'],
    correct: 0,
    explanation: 'A complete site needs validation, working navigation, and accessibility checks before it is portfolio-ready.',
  },
});

export const HTML_QUIZ_QUALITY_TARGET_KEYS = Object.freeze(
  Object.keys(HTML_QUIZ_QUALITY_ITEMS),
);

export const HTML_QUIZ_QUALITY_ITEM_IDS = Object.freeze(
  Object.values(HTML_QUIZ_QUALITY_ITEMS).map((item) => item.id),
);

export function getHtmlQuizQualityKey(quiz = {}) {
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  return `${quiz.lessonId}:${questions[0]?.id || ''}`;
}

export function applyHtmlQuizQualityItems(quizzes = []) {
  return quizzes.map((quiz) => {
    const qualityItem = HTML_QUIZ_QUALITY_ITEMS[getHtmlQuizQualityKey(quiz)];
    if (!qualityItem) return quiz;

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (questions.some((question) => question?.id === qualityItem.id)) return quiz;

    return {
      ...quiz,
      questions: [...questions, qualityItem],
    };
  });
}
