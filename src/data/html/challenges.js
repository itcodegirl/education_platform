const has = (code, str) => code.toLowerCase().includes(str.toLowerCase());
const count = (code, str) => (code.toLowerCase().match(new RegExp(str.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

// Helper for DOM-based tests. Returns the iframe's document or null if
// the iframe hasn't loaded yet — useChallengeSession.runTests already
// awaits the iframe's onLoad before grading, so this should normally
// be non-null. Falsy check returns false (test fails) to be safe.
const dom = (iframe) => iframe?.contentDocument || null;

export const HTML_CHALLENGES = [
  // ─── Demonstrated DOM-based grading pattern ─────────────────────
  // The test checks below run against the live iframe DOM (the
  // `iframe` arg, plumbed from useChallengeSession.runTests after the
  // iframe's onLoad). This is harder to game than the source-regex
  // pattern used by the rest of the file — a learner can no longer
  // pass "Uses <nav>" by typing `<!-- <nav> -->` because the parser
  // strips the comment before querySelector runs.
  //
  // Migrating the rest of the catalog is purely additive: change
  // each `check:(c)=>...` to `check:(_, iframe)=>...` and use the
  // `dom(iframe)` helper. Source-regex tests continue to work as-is
  // until each is migrated.
  { id:'html-ch-1', title:'Build a Navigation Bar', description:'Create a semantic nav with 4 links.', difficulty:'beginner', courseId:'html',
    starter:'<nav>\n  <!-- Add 4 links -->\n</nav>',
    requirements:['Use a <nav> element','Include exactly 4 links','Each link has href','One link opens in new tab'],
    tests:[
      { label:'Uses <nav>', check:(_, iframe)=>!!dom(iframe)?.querySelector('nav') },
      { label:'Has 4 links', check:(_, iframe)=>(dom(iframe)?.querySelectorAll('nav a, a').length || 0) >= 4 },
      { label:'All have href', check:(_, iframe)=>{
        const links = Array.from(dom(iframe)?.querySelectorAll('a') || []);
        return links.length >= 4 && links.every((a) => a.hasAttribute('href') && a.getAttribute('href').length > 0);
      } },
      { label:'One has target="_blank"', check:(_, iframe)=>!!dom(iframe)?.querySelector('a[target="_blank"]') },
    ],
    hint:'Use <a href="..."> for each link. Add target="_blank" to the external one.',
    solution:'<nav>\n  <a href="/">Home</a>\n  <a href="/about">About</a>\n  <a href="/contact">Contact</a>\n  <a href="https://github.com" target="_blank">GitHub</a>\n</nav>' },

  { id:'html-ch-2', title:'Accessible Contact Form', description:'Build a form with labels, required fields, and fieldset.', difficulty:'beginner', courseId:'html',
    starter:'<form>\n  <!-- name, email, message -->\n  <!-- Use labels, required, fieldset -->\n</form>',
    requirements:['Has <fieldset> with <legend>','Has name, email, textarea','Labels connected with for/id','Name and email required','Has submit button'],
    tests:[
      { label:'Uses <fieldset> and <legend>', check:c=>has(c,'<fieldset')&&has(c,'<legend') },
      { label:'Has text, email, textarea', check:c=>has(c,'type="text"')&&has(c,'type="email"')&&has(c,'<textarea') },
      { label:'Labels use for/id', check:c=>count(c,'for="')>=3&&count(c,'id="')>=3 },
      { label:'Required on 2+ fields', check:c=>count(c,'required')>=2 },
      { label:'Has submit button', check:c=>has(c,'type="submit"')||has(c,'<button') },
    ],
    hint:'<label for="x"> needs matching <input id="x">.',
    solution:'<form>\n  <fieldset>\n    <legend>Contact Us</legend>\n    <label for="name">Name</label>\n    <input type="text" id="name" name="name" required />\n    <label for="email">Email</label>\n    <input type="email" id="email" name="email" required />\n    <label for="msg">Message</label>\n    <textarea id="msg" name="message" rows="4"></textarea>\n    <button type="submit">Send</button>\n  </fieldset>\n</form>' },

  { id:'html-ch-3', title:'Semantic Page Layout', description:'Build a full page using semantic HTML - no divs.', difficulty:'beginner', courseId:'html',
    starter:'<!-- header, nav, main, section, article, aside, footer -->',
    requirements:['Has <header> with <nav>','Has <main>','Has <section> with <article>','Has <aside>','Has <footer>','No <div> elements'],
    tests:[
      { label:'<header> with <nav>', check:c=>has(c,'<header')&&has(c,'<nav') },
      { label:'<main>', check:c=>has(c,'<main') },
      { label:'<section> with <article>', check:c=>has(c,'<section')&&has(c,'<article') },
      { label:'<aside>', check:c=>has(c,'<aside') },
      { label:'<footer>', check:c=>has(c,'<footer') },
      { label:'No divs', check:c=>count(c,'<div')=== 0 },
    ],
    hint:'Think zones: header (top), main (center), aside (sidebar), footer (bottom).',
    solution:'<header>\n  <nav><a href="/">Home</a> <a href="/about">About</a></nav>\n</header>\n<main>\n  <section>\n    <h2>Posts</h2>\n    <article><h3>First Post</h3><p>Content.</p></article>\n  </section>\n  <aside><h3>About</h3><p>Sidebar.</p></aside>\n</main>\n<footer><p>&copy; 2025 CodeHerWay</p></footer>' },

  { id:'html-ch-4', title:'Data Table', description:'Build a structured table with thead, tbody, and 3+ rows.', difficulty:'beginner', courseId:'html',
    starter:'<table>\n  <!-- thead, tbody, th, td -->\n</table>',
    requirements:['Uses <thead> and <tbody>','Has <th> headers','At least 3 columns','At least 3 data rows'],
    tests:[
      { label:'Has <thead> and <tbody>', check:c=>has(c,'<thead')&&has(c,'<tbody') },
      { label:'Uses <th>', check:c=>count(c,'<th')>=3 },
      { label:'3+ columns', check:c=>count(c,'<th')>=3 },
      { label:'3+ data rows', check:c=>(c.match(/<tr[\s>]/gi)||[]).length>=4 },
    ],
    hint:'<thead> wraps header <tr>. <tbody> wraps data rows.',
    solution:'<table>\n  <thead>\n    <tr><th>Name</th><th>Role</th><th>Status</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Jenna</td><td>Developer</td><td>Active</td></tr>\n    <tr><td>Alex</td><td>Designer</td><td>Active</td></tr>\n    <tr><td>Sam</td><td>PM</td><td>Away</td></tr>\n  </tbody>\n</table>' },

  { id:'html-ch-5', title:'Image Gallery with Figures', description:'Create a 3-image gallery using figure and figcaption.', difficulty:'beginner', courseId:'html',
    starter:'<!-- 3 images with figure + figcaption -->\n<!-- Each image needs meaningful alt text -->',
    requirements:['3 <figure> elements','Each has <img> with alt','Each has <figcaption>','All images have width or height'],
    tests:[
      { label:'3 figures', check:c=>count(c,'<figure')>=3 },
      { label:'3 images with alt', check:c=>count(c,'<img')>=3&&count(c,'alt="')>=3 },
      { label:'3 figcaptions', check:c=>count(c,'<figcaption')>=3 },
      { label:'Width or height set', check:c=>count(c,'width=')>=3||count(c,'height=')>=3 },
    ],
    hint:'Wrap each <img> in a <figure> and add a <figcaption> below it.',
    solution:'<figure>\n  <img src="sunset.jpg" alt="Golden sunset over the ocean" width="400" />\n  <figcaption>Sunset at Malibu Beach</figcaption>\n</figure>\n<figure>\n  <img src="city.jpg" alt="Chicago skyline at night" width="400" />\n  <figcaption>Chicago after dark</figcaption>\n</figure>\n<figure>\n  <img src="code.jpg" alt="Code on a dark screen" width="400" />\n  <figcaption>Late night coding session</figcaption>\n</figure>' },

  { id:'html-ch-6', title:'FAQ Accordion (No JS)', description:'Build an FAQ section with 4 expandable questions using only HTML.', difficulty:'beginner', courseId:'html',
    starter:'<!-- Use <details> and <summary> -->\n<!-- No JavaScript needed! -->',
    requirements:['Uses <details> and <summary>','At least 4 questions','Each has answer content','Wrapped in a <section>'],
    tests:[
      { label:'Uses <details>', check:c=>count(c,'<details')>=4 },
      { label:'Uses <summary>', check:c=>count(c,'<summary')>=4 },
      { label:'4+ questions', check:c=>count(c,'<summary')>=4 },
      { label:'Wrapped in <section>', check:c=>has(c,'<section') },
    ],
    hint:'<details><summary>Question?</summary><p>Answer.</p></details>',
    solution:'<section>\n  <h2>FAQ</h2>\n  <details><summary>What is HTML?</summary><p>HyperText Markup Language - structures web content.</p></details>\n  <details><summary>Is HTML a programming language?</summary><p>No, it is a markup language.</p></details>\n  <details><summary>What is semantic HTML?</summary><p>Using tags that describe meaning, like nav, main, article.</p></details>\n  <details><summary>Why is alt text important?</summary><p>Screen readers need it to describe images to visually impaired users.</p></details>\n</section>' },

  { id:'html-ch-7', title:'Registration Form', description:'Build a job application form with multiple input types.', difficulty:'intermediate', courseId:'html',
    starter:'<form>\n  <!-- name, email, phone, experience (radio),\n       skills (checkboxes), resume (file), submit -->\n</form>',
    requirements:['Has text, email, and tel inputs','Has radio buttons for experience','Has checkboxes for skills','Has file upload','All inputs have labels','Has submit button'],
    tests:[
      { label:'Has text, email, tel', check:c=>has(c,'type="text"')&&has(c,'type="email"')&&has(c,'type="tel"') },
      { label:'Has radio buttons', check:c=>count(c,'type="radio"')>=2 },
      { label:'Has checkboxes', check:c=>count(c,'type="checkbox"')>=2 },
      { label:'Has file input', check:c=>has(c,'type="file"') },
      { label:'Labels present', check:c=>count(c,'<label')>=4 },
      { label:'Submit button', check:c=>has(c,'type="submit"')||has(c,'<button') },
    ],
    hint:'Group radios with the same name attribute. Checkboxes can have different names.',
    solution:'<form>\n  <label for="name">Name</label>\n  <input type="text" id="name" required />\n  <label for="email">Email</label>\n  <input type="email" id="email" required />\n  <label for="phone">Phone</label>\n  <input type="tel" id="phone" />\n  <p>Experience:</p>\n  <label><input type="radio" name="exp" value="junior" /> Junior</label>\n  <label><input type="radio" name="exp" value="mid" /> Mid</label>\n  <label><input type="radio" name="exp" value="senior" /> Senior</label>\n  <p>Skills:</p>\n  <label><input type="checkbox" name="skills" value="html" /> HTML</label>\n  <label><input type="checkbox" name="skills" value="css" /> CSS</label>\n  <label><input type="checkbox" name="skills" value="js" /> JavaScript</label>\n  <label for="resume">Resume</label>\n  <input type="file" id="resume" accept=".pdf" />\n  <button type="submit">Apply</button>\n</form>' },

  { id:'html-ch-8', title:'SEO-Ready Head Section', description:'Write a complete <head> with meta tags, OG, and favicon.', difficulty:'intermediate', courseId:'html',
    starter:'<head>\n  <!-- charset, viewport, title, description,\n       Open Graph, favicon, CSS link -->\n</head>',
    requirements:['Has charset and viewport meta','Has <title>','Has meta description','Has Open Graph tags','Has favicon link','Has CSS link'],
    tests:[
      { label:'charset meta', check:c=>has(c,'charset="utf-8"')||has(c,'charset="UTF-8"') },
      { label:'viewport meta', check:c=>has(c,'name="viewport"') },
      { label:'<title> present', check:c=>has(c,'<title') },
      { label:'meta description', check:c=>has(c,'name="description"') },
      { label:'Open Graph tags', check:c=>has(c,'og:title')&&has(c,'og:image') },
      { label:'Favicon', check:c=>has(c,'favicon')||has(c,'rel="icon"') },
    ],
    hint:'OG tags use property= instead of name=: <meta property="og:title" content="...">',
    solution:'<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Portfolio | Web Developer</title>\n  <meta name="description" content="Portfolio of a frontend developer." />\n  <meta property="og:title" content="My Portfolio" />\n  <meta property="og:description" content="Frontend developer portfolio." />\n  <meta property="og:image" content="https://example.com/og.jpg" />\n  <link rel="icon" href="favicon.ico" />\n  <link rel="stylesheet" href="styles.css" />\n</head>' },

  { id:'html-ch-9', title:'Accessible Icon Toolbar', description:'Build a toolbar with icon buttons and proper ARIA.', difficulty:'intermediate', courseId:'html',
    starter:'<!-- 4 icon buttons with aria-label -->\n<!-- Decorative icons need aria-hidden -->',
    requirements:['4+ <button> elements','Each has aria-label','Uses semantic elements','Decorative content has aria-hidden'],
    tests:[
      { label:'4+ buttons', check:c=>count(c,'<button')>=4 },
      { label:'aria-label on each', check:c=>count(c,'aria-label')>=4 },
      { label:'No <div> as button', check:c=>!has(c,'<div onclick')&&!has(c,'<div onClick') },
      { label:'aria-hidden used', check:c=>has(c,'aria-hidden') },
    ],
    hint:'<button aria-label="Delete"><span aria-hidden="true">🗑️</span></button>',
    solution:'<nav aria-label="Toolbar">\n  <button aria-label="Home"><span aria-hidden="true">🏠</span></button>\n  <button aria-label="Search"><span aria-hidden="true">🔍</span></button>\n  <button aria-label="Settings"><span aria-hidden="true">⚙️</span></button>\n  <button aria-label="Profile"><span aria-hidden="true">👤</span></button>\n</nav>' },

  { id:'html-ch-10', title:'Multi-Page Site Structure', description:'Create index.html with navigation linking to 3 other pages.', difficulty:'intermediate', courseId:'html',
    starter:'<!-- Build a homepage with:\n     - Semantic layout\n     - Navigation to about, projects, contact\n     - Hero section with heading\n     - Footer with copyright -->',
    requirements:['Full HTML5 skeleton','Semantic layout (header, main, footer)','Navigation with 3+ links','Has an <h1>','Footer with copyright entity','Uses relative paths'],
    tests:[
      { label:'DOCTYPE and html', check:c=>has(c,'<!doctype html')||has(c,'<!DOCTYPE html') },
      { label:'header + main + footer', check:c=>has(c,'<header')&&has(c,'<main')&&has(c,'<footer') },
      { label:'3+ nav links', check:c=>count(c,'<a ')>=3 },
      { label:'One <h1>', check:c=>count(c,'<h1')===1 },
      { label:'Copyright entity', check:c=>has(c,'&copy;')||has(c,'(c)') },
      { label:'Relative paths', check:c=>has(c,'.html') },
    ],
    hint:'Use relative paths: <a href="about.html">About</a>',
    solution:'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Site</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <a href="index.html">Home</a>\n      <a href="about.html">About</a>\n      <a href="projects.html">Projects</a>\n      <a href="contact.html">Contact</a>\n    </nav>\n  </header>\n  <main>\n    <h1>Welcome to My Site</h1>\n    <p>Frontend developer portfolio.</p>\n  </main>\n  <footer>\n    <p>&copy; 2025 My Name</p>\n  </footer>\n</body>\n</html>' },
];




