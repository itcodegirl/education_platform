const has = (code, str) => code.toLowerCase().includes(str.toLowerCase());

// Helper for DOM-based tests. Returns the preview snapshot document or
// null if grading could not inspect the iframe. useChallengeSession
// waits for the iframe load first, then requests a read-only snapshot
// over postMessage so learner code stays in an opaque-origin sandbox.
const dom = (iframe) => iframe?.contentDocument || null;

export const HTML_CHALLENGES = [
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
      { label:'Uses <fieldset> and <legend>', check:(_, iframe)=>{
        const fs = dom(iframe)?.querySelector('fieldset');
        return !!fs && !!fs.querySelector('legend');
      } },
      { label:'Has text, email, textarea', check:(_, iframe)=>{
        const d = dom(iframe);
        return !!(d?.querySelector('input[type="text"], input:not([type])') &&
                  d?.querySelector('input[type="email"]') &&
                  d?.querySelector('textarea'));
      } },
      { label:'Labels use for/id', check:(_, iframe)=>{
        const d = dom(iframe);
        const labels = Array.from(d?.querySelectorAll('label[for]') || []);
        return labels.filter((l) => !!d?.querySelector(`[id="${l.getAttribute('for')}"]`)).length >= 2;
      } },
      { label:'Required on 2+ fields', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('[required]').length || 0) >= 2 },
      { label:'Has submit button', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('button[type="submit"], input[type="submit"], button:not([type])') },
    ],
    hint:'<label for="x"> needs matching <input id="x">.',
    solution:'<form>\n  <fieldset>\n    <legend>Contact Us</legend>\n    <label for="name">Name</label>\n    <input type="text" id="name" name="name" required />\n    <label for="email">Email</label>\n    <input type="email" id="email" name="email" required />\n    <label for="msg">Message</label>\n    <textarea id="msg" name="message" rows="4"></textarea>\n    <button type="submit">Send</button>\n  </fieldset>\n</form>' },

  { id:'html-ch-3', title:'Semantic Page Layout', description:'Build a full page using semantic HTML - no divs.', difficulty:'beginner', courseId:'html',
    starter:'<!-- header, nav, main, section, article, aside, footer -->',
    requirements:['Has <header> with <nav>','Has <main>','Has <section> with <article>','Has <aside>','Has <footer>','No <div> elements'],
    tests:[
      { label:'<header> with <nav>', check:(_, iframe)=>{
        const header = dom(iframe)?.querySelector('header');
        return !!header && !!header.querySelector('nav');
      } },
      { label:'<main>', check:(_, iframe)=>!!dom(iframe)?.querySelector('main') },
      { label:'<section> with <article>', check:(_, iframe)=>{
        const section = dom(iframe)?.querySelector('section');
        return !!section && !!section.querySelector('article');
      } },
      { label:'<aside>', check:(_, iframe)=>!!dom(iframe)?.querySelector('aside') },
      { label:'<footer>', check:(_, iframe)=>!!dom(iframe)?.querySelector('footer') },
      { label:'No divs', check:(_, iframe)=>{
        const body = dom(iframe)?.body;
        if (!body) return false;
        return body.querySelectorAll('div').length === 0;
      } },
    ],
    hint:'Think zones: header (top), main (center), aside (sidebar), footer (bottom).',
    solution:'<header>\n  <nav><a href="/">Home</a> <a href="/about">About</a></nav>\n</header>\n<main>\n  <section>\n    <h2>Posts</h2>\n    <article><h3>First Post</h3><p>Content.</p></article>\n  </section>\n  <aside><h3>About</h3><p>Sidebar.</p></aside>\n</main>\n<footer><p>&copy; 2025 CodeHerWay</p></footer>' },

  { id:'html-ch-4', title:'Data Table', description:'Build a structured table with thead, tbody, and 3+ rows.', difficulty:'beginner', courseId:'html',
    starter:'<table>\n  <!-- thead, tbody, th, td -->\n</table>',
    requirements:['Uses <thead> and <tbody>','Has <th> headers','At least 3 columns','At least 3 data rows'],
    tests:[
      { label:'Has <thead> and <tbody>', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('thead') && !!dom(iframe)?.querySelector('tbody') },
      { label:'Uses <th>', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('th').length || 0) >= 3 },
      { label:'3+ columns', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('thead th, thead td').length || 0) >= 3 },
      { label:'3+ data rows', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('tbody tr').length || 0) >= 3 },
    ],
    hint:'<thead> wraps header <tr>. <tbody> wraps data rows.',
    solution:'<table>\n  <thead>\n    <tr><th>Name</th><th>Role</th><th>Status</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Jenna</td><td>Developer</td><td>Active</td></tr>\n    <tr><td>Alex</td><td>Designer</td><td>Active</td></tr>\n    <tr><td>Sam</td><td>PM</td><td>Away</td></tr>\n  </tbody>\n</table>' },

  { id:'html-ch-5', title:'Image Gallery with Figures', description:'Create a 3-image gallery using figure and figcaption.', difficulty:'beginner', courseId:'html',
    starter:'<!-- 3 images with figure + figcaption -->\n<!-- Each image needs meaningful alt text -->',
    requirements:['3 <figure> elements','Each has <img> with alt','Each has <figcaption>','All images have width or height'],
    tests:[
      { label:'3 figures', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('figure').length || 0) >= 3 },
      { label:'3 images with alt', check:(_, iframe)=>{
        const imgs = Array.from(dom(iframe)?.querySelectorAll('img') || []);
        return imgs.filter((img) => img.hasAttribute('alt') && img.getAttribute('alt').length > 0).length >= 3;
      } },
      { label:'3 figcaptions', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('figcaption').length || 0) >= 3 },
      { label:'Width or height set', check:(_, iframe)=>{
        const imgs = Array.from(dom(iframe)?.querySelectorAll('img') || []);
        return imgs.filter((img) => img.hasAttribute('width') || img.hasAttribute('height')).length >= 3;
      } },
    ],
    hint:'Wrap each <img> in a <figure> and add a <figcaption> below it.',
    solution:'<figure>\n  <img src="sunset.jpg" alt="Golden sunset over the ocean" width="400" />\n  <figcaption>Sunset at Malibu Beach</figcaption>\n</figure>\n<figure>\n  <img src="city.jpg" alt="Chicago skyline at night" width="400" />\n  <figcaption>Chicago after dark</figcaption>\n</figure>\n<figure>\n  <img src="code.jpg" alt="Code on a dark screen" width="400" />\n  <figcaption>Late night coding session</figcaption>\n</figure>' },

  { id:'html-ch-6', title:'FAQ Accordion (No JS)', description:'Build an FAQ section with 4 expandable questions using only HTML.', difficulty:'beginner', courseId:'html',
    starter:'<!-- Use <details> and <summary> -->\n<!-- No JavaScript needed! -->',
    requirements:['Uses <details> and <summary>','At least 4 questions','Each has answer content','Wrapped in a <section>'],
    tests:[
      { label:'Uses <details>', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('details').length || 0) >= 4 },
      { label:'Uses <summary>', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('summary').length || 0) >= 4 },
      { label:'4+ questions', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('details').length || 0) >= 4 },
      { label:'Wrapped in <section>', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('section') },
    ],
    hint:'<details><summary>Question?</summary><p>Answer.</p></details>',
    solution:'<section>\n  <h2>FAQ</h2>\n  <details><summary>What is HTML?</summary><p>HyperText Markup Language - structures web content.</p></details>\n  <details><summary>Is HTML a programming language?</summary><p>No, it is a markup language.</p></details>\n  <details><summary>What is semantic HTML?</summary><p>Using tags that describe meaning, like nav, main, article.</p></details>\n  <details><summary>Why is alt text important?</summary><p>Screen readers need it to describe images to visually impaired users.</p></details>\n</section>' },

  { id:'html-ch-7', title:'Registration Form', description:'Build a job application form with multiple input types.', difficulty:'intermediate', courseId:'html',
    starter:'<form>\n  <!-- name, email, phone, experience (radio),\n       skills (checkboxes), resume (file), submit -->\n</form>',
    requirements:['Has text, email, and tel inputs','Has radio buttons for experience','Has checkboxes for skills','Has file upload','All inputs have labels','Has submit button'],
    tests:[
      { label:'Has text, email, tel', check:(_, iframe)=>{
        const d = dom(iframe);
        return !!(d?.querySelector('input[type="text"], input:not([type])') &&
                  d?.querySelector('input[type="email"]') &&
                  d?.querySelector('input[type="tel"]'));
      } },
      { label:'Has radio buttons', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('input[type="radio"]').length || 0) >= 2 },
      { label:'Has checkboxes', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('input[type="checkbox"]').length || 0) >= 2 },
      { label:'Has file input', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('input[type="file"]') },
      { label:'Labels present', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('label').length || 0) >= 4 },
      { label:'Submit button', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('button[type="submit"], input[type="submit"], button:not([type])') },
    ],
    hint:'Group radios with the same name attribute. Checkboxes can have different names.',
    solution:'<form>\n  <label for="name">Name</label>\n  <input type="text" id="name" required />\n  <label for="email">Email</label>\n  <input type="email" id="email" required />\n  <label for="phone">Phone</label>\n  <input type="tel" id="phone" />\n  <p>Experience:</p>\n  <label><input type="radio" name="exp" value="junior" /> Junior</label>\n  <label><input type="radio" name="exp" value="mid" /> Mid</label>\n  <label><input type="radio" name="exp" value="senior" /> Senior</label>\n  <p>Skills:</p>\n  <label><input type="checkbox" name="skills" value="html" /> HTML</label>\n  <label><input type="checkbox" name="skills" value="css" /> CSS</label>\n  <label><input type="checkbox" name="skills" value="js" /> JavaScript</label>\n  <label for="resume">Resume</label>\n  <input type="file" id="resume" accept=".pdf" />\n  <button type="submit">Apply</button>\n</form>' },

  { id:'html-ch-8', title:'SEO-Ready Head Section', description:'Write a complete <head> with meta tags, OG, and favicon.', difficulty:'intermediate', courseId:'html',
    starter:'<head>\n  <!-- charset, viewport, title, description,\n       Open Graph, favicon, CSS link -->\n</head>',
    requirements:['Has charset and viewport meta','Has <title>','Has meta description','Has Open Graph tags','Has favicon link','Has CSS link'],
    tests:[
      // Meta/link elements written in a <head> block get inserted into the
      // body of the preview iframe, but querySelector searches the whole
      // document tree so these DOM queries still find them correctly.
      { label:'charset meta', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('meta[charset]') },
      { label:'viewport meta', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('meta[name="viewport"]') },
      { label:'<title> present', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('title') },
      { label:'meta description', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('meta[name="description"]') },
      { label:'Open Graph tags', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('meta[property="og:title"]') &&
        !!dom(iframe)?.querySelector('meta[property="og:image"]') },
      { label:'Favicon', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[href*="favicon"]') },
    ],
    hint:'OG tags use property= instead of name=: <meta property="og:title" content="...">',
    solution:'<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Portfolio | Web Developer</title>\n  <meta name="description" content="Portfolio of a frontend developer." />\n  <meta property="og:title" content="My Portfolio" />\n  <meta property="og:description" content="Frontend developer portfolio." />\n  <meta property="og:image" content="https://example.com/og.jpg" />\n  <link rel="icon" href="favicon.ico" />\n  <link rel="stylesheet" href="styles.css" />\n</head>' },

  { id:'html-ch-9', title:'Accessible Icon Toolbar', description:'Build a toolbar with icon buttons and proper ARIA.', difficulty:'intermediate', courseId:'html',
    starter:'<!-- 4 icon buttons with aria-label -->\n<!-- Decorative icons need aria-hidden -->',
    requirements:['4+ <button> elements','Each has aria-label','Uses semantic elements','Decorative content has aria-hidden'],
    tests:[
      { label:'4+ buttons', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('button').length || 0) >= 4 },
      { label:'aria-label on each', check:(_, iframe)=>{
        const buttons = Array.from(dom(iframe)?.querySelectorAll('button') || []);
        return buttons.length >= 4 && buttons.every((b) => b.hasAttribute('aria-label'));
      } },
      { label:'No <div> as button', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('div[onclick]').length || 0) === 0 },
      { label:'aria-hidden used', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('[aria-hidden]') },
    ],
    hint:'<button aria-label="Delete"><span aria-hidden="true">🗑️</span></button>',
    solution:'<nav aria-label="Toolbar">\n  <button aria-label="Home"><span aria-hidden="true">🏠</span></button>\n  <button aria-label="Search"><span aria-hidden="true">🔍</span></button>\n  <button aria-label="Settings"><span aria-hidden="true">⚙️</span></button>\n  <button aria-label="Profile"><span aria-hidden="true">👤</span></button>\n</nav>' },

  { id:'html-ch-10', title:'Multi-Page Site Structure', description:'Create index.html with navigation linking to 3 other pages.', difficulty:'intermediate', courseId:'html',
    starter:'<!-- Build a homepage with:\n     - Semantic layout\n     - Navigation to about, projects, contact\n     - Hero section with heading\n     - Footer with copyright -->',
    requirements:['Full HTML5 skeleton','Semantic layout (header, main, footer)','Navigation with 3+ links','Has an <h1>','Footer with copyright entity','Uses relative paths'],
    tests:[
      // DOCTYPE is a document-level declaration, not a DOM element — source
      // check is the only reliable way to verify the learner wrote it.
      { label:'DOCTYPE and html', check:(c)=>has(c,'<!doctype html')||has(c,'<!DOCTYPE html') },
      { label:'header + main + footer', check:(_, iframe)=>
        !!dom(iframe)?.querySelector('header') &&
        !!dom(iframe)?.querySelector('main') &&
        !!dom(iframe)?.querySelector('footer') },
      { label:'3+ nav links', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('a').length || 0) >= 3 },
      { label:'One <h1>', check:(_, iframe)=>
        (dom(iframe)?.querySelectorAll('h1').length || 0) === 1 },
      { label:'Copyright entity', check:(c)=>has(c,'&copy;')||has(c,'©') },
      { label:'Relative paths', check:(c)=>has(c,'.html') },
    ],
    hint:'Use relative paths: <a href="about.html">About</a>',
    solution:'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Site</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <a href="index.html">Home</a>\n      <a href="about.html">About</a>\n      <a href="projects.html">Projects</a>\n      <a href="contact.html">Contact</a>\n    </nav>\n  </header>\n  <main>\n    <h1>Welcome to My Site</h1>\n    <p>Frontend developer portfolio.</p>\n  </main>\n  <footer>\n    <p>&copy; 2025 My Name</p>\n  </footer>\n</body>\n</html>' },
];
