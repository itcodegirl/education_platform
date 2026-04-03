// ═══════════════════════════════════════════════
// CODE CHALLENGES — 40+ auto-graded exercises
// 10 per course, progressive difficulty
// ═══════════════════════════════════════════════

const has = (code, str) => code.toLowerCase().includes(str.toLowerCase());
const count = (code, str) => (code.toLowerCase().match(new RegExp(str.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

// ═══════════════════════════════════════════════
// HTML CHALLENGES (10)
// ═══════════════════════════════════════════════

export const HTML_CHALLENGES = [
  { id:'html-ch-1', title:'Build a Navigation Bar', description:'Create a semantic nav with 4 links.', difficulty:'beginner', courseId:'html',
    starter:'<nav>\n  <!-- Add 4 links -->\n</nav>',
    requirements:['Use a <nav> element','Include exactly 4 links','Each link has href','One link opens in new tab'],
    tests:[
      { label:'Uses <nav>', check:c=>has(c,'<nav') },
      { label:'Has 4 links', check:c=>count(c,'<a ')>=4||count(c,'<a>')>=4 },
      { label:'All have href', check:c=>count(c,'href=')>=4 },
      { label:'One has target="_blank"', check:c=>has(c,'target="_blank"') },
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

  { id:'html-ch-3', title:'Semantic Page Layout', description:'Build a full page using semantic HTML — no divs.', difficulty:'beginner', courseId:'html',
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
    solution:'<section>\n  <h2>FAQ</h2>\n  <details><summary>What is HTML?</summary><p>HyperText Markup Language — structures web content.</p></details>\n  <details><summary>Is HTML a programming language?</summary><p>No, it is a markup language.</p></details>\n  <details><summary>What is semantic HTML?</summary><p>Using tags that describe meaning, like nav, main, article.</p></details>\n  <details><summary>Why is alt text important?</summary><p>Screen readers need it to describe images to visually impaired users.</p></details>\n</section>' },

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
      { label:'Copyright entity', check:c=>has(c,'&copy;')||has(c,'©') },
      { label:'Relative paths', check:c=>has(c,'.html') },
    ],
    hint:'Use relative paths: <a href="about.html">About</a>',
    solution:'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Site</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <a href="index.html">Home</a>\n      <a href="about.html">About</a>\n      <a href="projects.html">Projects</a>\n      <a href="contact.html">Contact</a>\n    </nav>\n  </header>\n  <main>\n    <h1>Welcome to My Site</h1>\n    <p>Frontend developer portfolio.</p>\n  </main>\n  <footer>\n    <p>&copy; 2025 My Name</p>\n  </footer>\n</body>\n</html>' },
];

// ═══════════════════════════════════════════════
// CSS CHALLENGES (10)
// ═══════════════════════════════════════════════

export const CSS_CHALLENGES = [
  { id:'css-ch-1', title:'Flexbox Navigation', description:'Style a nav bar with Flexbox — centered with spacing.', difficulty:'beginner', courseId:'css',
    previewHTML:'<nav class="navbar"><a href="#">Home</a><a href="#">About</a><a href="#">Projects</a><a href="#">Contact</a></nav>',
    starter:'.navbar {\n  /* flex container, center, gap */\n}\n.navbar a {\n  /* style links */\n}',
    requirements:['display: flex','Centers with justify-content','Gap or spacing','No underlines'],
    tests:[
      { label:'display: flex', check:c=>has(c,'display: flex')||has(c,'display:flex') },
      { label:'justify-content', check:c=>has(c,'justify-content') },
      { label:'Gap or spacing', check:c=>has(c,'gap')||has(c,'padding')||has(c,'margin') },
      { label:'No underlines', check:c=>has(c,'text-decoration') },
    ],
    hint:'display:flex, justify-content:center, gap:24px',
    solution:'.navbar {\n  display: flex;\n  justify-content: center;\n  gap: 24px;\n  padding: 16px;\n  background: #1a1a2e;\n}\n.navbar a {\n  color: #ff6b9d;\n  text-decoration: none;\n  font-weight: 600;\n}' },

  { id:'css-ch-2', title:'Responsive Card Grid', description:'Create a grid that adapts from 1 to 3 columns.', difficulty:'intermediate', courseId:'css',
    previewHTML:'<div class="grid"><div class="card"><h3>Card 1</h3><p>Content</p></div><div class="card"><h3>Card 2</h3><p>Content</p></div><div class="card"><h3>Card 3</h3><p>Content</p></div></div>',
    starter:'.grid {\n  /* responsive grid */\n}\n.card {\n  /* style cards */\n}',
    requirements:['display: grid','auto-fill or auto-fit','Cards have padding','Gap between cards'],
    tests:[
      { label:'display: grid', check:c=>has(c,'display: grid')||has(c,'display:grid') },
      { label:'auto-fill/auto-fit', check:c=>has(c,'auto-fill')||has(c,'auto-fit') },
      { label:'Padding', check:c=>has(c,'padding') },
      { label:'Gap', check:c=>has(c,'gap') },
    ],
    hint:'grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))',
    solution:'.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\n  gap: 20px;\n}\n.card {\n  background: #1a1a2e;\n  padding: 24px;\n  border-radius: 12px;\n  border: 1px solid #2a2a3e;\n}' },

  { id:'css-ch-3', title:'Center Everything', description:'Center a card both horizontally and vertically in the viewport.', difficulty:'beginner', courseId:'css',
    previewHTML:'<div class="wrapper"><div class="card"><h2>Centered</h2><p>Perfectly centered card.</p></div></div>',
    starter:'.wrapper {\n  /* full viewport height */\n  /* center the card */\n}\n.card {\n  /* style the card */\n}',
    requirements:['min-height: 100vh','Uses flex or grid centering','Card has padding and border-radius','Card has a background'],
    tests:[
      { label:'Full viewport height', check:c=>has(c,'100vh')||has(c,'100dvh') },
      { label:'Centering method', check:c=>(has(c,'justify-content')&&has(c,'align-items'))||has(c,'place-items')||has(c,'margin: auto')||has(c,'margin:auto') },
      { label:'Card padding', check:c=>has(c,'padding') },
      { label:'Border-radius', check:c=>has(c,'border-radius') },
    ],
    hint:'Flex: display:flex; justify-content:center; align-items:center. Grid: display:grid; place-items:center.',
    solution:'.wrapper {\n  min-height: 100vh;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.card {\n  padding: 40px;\n  border-radius: 16px;\n  background: #1a1a2e;\n  border: 1px solid #2a2a3e;\n}' },

  { id:'css-ch-4', title:'Hover Card Effect', description:'Create a card with a smooth hover transform and shadow.', difficulty:'beginner', courseId:'css',
    previewHTML:'<div class="card"><h3>Hover Me</h3><p>I transform on hover!</p></div>',
    starter:'.card {\n  /* base styles */\n  /* add transition */\n}\n.card:hover {\n  /* transform + shadow */\n}',
    requirements:['Has transition property','Uses transform on hover','Has box-shadow on hover','Transition is smooth (0.2s+)'],
    tests:[
      { label:'transition property', check:c=>has(c,'transition') },
      { label:'transform on hover', check:c=>has(c,':hover')&&has(c,'transform') },
      { label:'box-shadow on hover', check:c=>has(c,'box-shadow') },
      { label:'Smooth timing', check:c=>has(c,'0.2s')||has(c,'0.3s')||has(c,'0.25s')||has(c,'200ms')||has(c,'300ms') },
    ],
    hint:'transition: all 0.3s ease; then :hover { transform: translateY(-4px); box-shadow: ... }',
    solution:'.card {\n  padding: 24px;\n  background: #1a1a2e;\n  border-radius: 12px;\n  border: 1px solid #2a2a3e;\n  transition: all 0.3s ease;\n}\n.card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 8px 24px rgba(0,0,0,0.3);\n  border-color: #ff6b9d;\n}' },

  { id:'css-ch-5', title:'CSS Variables Theme', description:'Create a theme using CSS custom properties.', difficulty:'intermediate', courseId:'css',
    previewHTML:'<div class="themed"><h2>Themed Section</h2><p>Using CSS variables for colors.</p><button>Action</button></div>',
    starter:':root {\n  /* define variables */\n}\n.themed {\n  /* use variables */\n}\n.themed button {\n  /* use variables */\n}',
    requirements:['Define 3+ CSS variables in :root','Use var() to apply them','Button uses variable colors','Background uses a variable'],
    tests:[
      { label:'3+ variables in :root', check:c=>has(c,':root')&&count(c,'--')>=3 },
      { label:'Uses var()', check:c=>count(c,'var(--')>=3 },
      { label:'Button styled', check:c=>has(c,'button')&&has(c,'var(--') },
      { label:'Background uses variable', check:c=>has(c,'background')&&has(c,'var(--') },
    ],
    hint:':root { --bg: #0f0f1a; --text: #e0e0ec; --accent: #ff6b9d; }',
    solution:':root {\n  --bg: #0f0f1a;\n  --text: #e0e0ec;\n  --accent: #ff6b9d;\n  --surface: #1a1a2e;\n}\n.themed {\n  background: var(--bg);\n  color: var(--text);\n  padding: 32px;\n  border-radius: 12px;\n}\n.themed button {\n  background: var(--accent);\n  color: var(--bg);\n  border: none;\n  padding: 10px 24px;\n  border-radius: 8px;\n  cursor: pointer;\n}' },

  { id:'css-ch-6', title:'Mobile-First Media Query', description:'Style a layout that stacks on mobile, goes side-by-side on desktop.', difficulty:'intermediate', courseId:'css',
    previewHTML:'<div class="layout"><div class="sidebar">Sidebar</div><div class="main">Main Content</div></div>',
    starter:'.layout {\n  /* mobile: stacked */\n}\n.sidebar {\n  /* mobile styles */\n}\n@media (min-width: 768px) {\n  .layout {\n    /* desktop: side by side */\n  }\n}',
    requirements:['Mobile-first (no media query for mobile)','@media with min-width','Desktop uses flex or grid','Sidebar has a fixed or percentage width'],
    tests:[
      { label:'Has @media', check:c=>has(c,'@media') },
      { label:'Uses min-width (mobile-first)', check:c=>has(c,'min-width') },
      { label:'Desktop flex or grid', check:c=>has(c,'display: flex')||has(c,'display:flex')||has(c,'display: grid')||has(c,'display:grid') },
      { label:'Sidebar width', check:c=>has(c,'width')&&(has(c,'sidebar')||has(c,'250px')||has(c,'280px')||has(c,'25%')||has(c,'30%')) },
    ],
    hint:'Start stacked (display:block), then @media(min-width:768px) { display:flex }',
    solution:'.layout {\n  display: block;\n}\n.sidebar {\n  background: #1a1a2e;\n  padding: 20px;\n}\n.main {\n  padding: 20px;\n}\n@media (min-width: 768px) {\n  .layout {\n    display: flex;\n  }\n  .sidebar {\n    width: 250px;\n    flex-shrink: 0;\n  }\n  .main {\n    flex: 1;\n  }\n}' },

  { id:'css-ch-7', title:'Button Variants', description:'Create primary, secondary, and danger button styles.', difficulty:'beginner', courseId:'css',
    previewHTML:'<button class="btn primary">Primary</button>\n<button class="btn secondary">Secondary</button>\n<button class="btn danger">Danger</button>',
    starter:'.btn {\n  /* shared styles */\n}\n.primary {\n  /* primary color */\n}\n.secondary {\n  /* outline style */\n}\n.danger {\n  /* red/danger */\n}',
    requirements:['Shared .btn base styles','3 color variants','Has border-radius','Has hover states'],
    tests:[
      { label:'Shared .btn styles', check:c=>has(c,'.btn')&&has(c,'padding') },
      { label:'.primary styled', check:c=>has(c,'.primary') },
      { label:'.secondary styled', check:c=>has(c,'.secondary') },
      { label:'.danger styled', check:c=>has(c,'.danger') },
    ],
    hint:'Shared base: padding, border-radius, font. Variants override background and color.',
    solution:'.btn {\n  padding: 10px 24px;\n  border: 2px solid transparent;\n  border-radius: 8px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.primary {\n  background: #ff6b9d;\n  color: #0f0f1a;\n}\n.secondary {\n  background: transparent;\n  border-color: #4ecdc4;\n  color: #4ecdc4;\n}\n.danger {\n  background: #ff4444;\n  color: white;\n}' },

  { id:'css-ch-8', title:'Glassmorphism Card', description:'Create a frosted glass card effect.', difficulty:'intermediate', courseId:'css',
    previewHTML:'<div class="glass-bg"><div class="glass-card"><h3>Glass Card</h3><p>Frosted glass effect</p></div></div>',
    starter:'.glass-bg {\n  /* colorful background */\n  min-height: 100vh;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.glass-card {\n  /* glassmorphism effect */\n}',
    requirements:['Semi-transparent background (rgba)','backdrop-filter: blur','Border-radius','Has a subtle border'],
    tests:[
      { label:'rgba or transparent bg', check:c=>has(c,'rgba') },
      { label:'backdrop-filter: blur', check:c=>has(c,'backdrop-filter')&&has(c,'blur') },
      { label:'border-radius', check:c=>has(c,'border-radius') },
      { label:'Subtle border', check:c=>has(c,'border') },
    ],
    hint:'background: rgba(255,255,255,0.05); backdrop-filter: blur(16px);',
    solution:'.glass-bg {\n  min-height: 100vh;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  background: linear-gradient(135deg, #667eea, #764ba2);\n}\n.glass-card {\n  padding: 40px;\n  border-radius: 16px;\n  background: rgba(255,255,255,0.08);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255,255,255,0.15);\n  color: white;\n}' },

  { id:'css-ch-9', title:'Keyframe Animation', description:'Create a pulsing glow animation on a button.', difficulty:'intermediate', courseId:'css',
    previewHTML:'<button class="glow-btn">Click Me</button>',
    starter:'.glow-btn {\n  /* button styles */\n  /* apply animation */\n}\n@keyframes glow {\n  /* define animation steps */\n}',
    requirements:['@keyframes defined','animation property applied','Uses box-shadow','Infinite loop'],
    tests:[
      { label:'@keyframes', check:c=>has(c,'@keyframes') },
      { label:'animation property', check:c=>has(c,'animation:') },
      { label:'box-shadow', check:c=>has(c,'box-shadow') },
      { label:'infinite', check:c=>has(c,'infinite') },
    ],
    hint:'@keyframes glow { 0%,100% { box-shadow: 0 0 5px } 50% { box-shadow: 0 0 20px } }',
    solution:'.glow-btn {\n  padding: 14px 32px;\n  background: #ff6b9d;\n  color: #0f0f1a;\n  border: none;\n  border-radius: 8px;\n  font-weight: 700;\n  font-size: 16px;\n  cursor: pointer;\n  animation: glow 2s ease-in-out infinite;\n}\n@keyframes glow {\n  0%, 100% { box-shadow: 0 0 8px #ff6b9d40; }\n  50% { box-shadow: 0 0 24px #ff6b9d80; }\n}' },

  { id:'css-ch-10', title:'Form Styling', description:'Style a form with focus states and validation colors.', difficulty:'intermediate', courseId:'css',
    previewHTML:'<form class="styled-form"><label for="email">Email</label><input type="email" id="email" placeholder="you@example.com" required /><label for="pass">Password</label><input type="password" id="pass" placeholder="••••••" required /><button type="submit">Sign In</button></form>',
    starter:'.styled-form { /* container */ }\n.styled-form input { /* base input */ }\n.styled-form input:focus { /* focus state */ }\n.styled-form button { /* submit */ }',
    requirements:['Input has border and padding','Focus state changes border color','Uses outline: none with custom focus','Button is fully styled'],
    tests:[
      { label:'Input padding', check:c=>has(c,'input')&&has(c,'padding') },
      { label:'Focus state', check:c=>has(c,':focus') },
      { label:'Outline removed', check:c=>has(c,'outline: none')||has(c,'outline:none') },
      { label:'Button styled', check:c=>has(c,'button')&&has(c,'background') },
    ],
    hint:'input:focus { outline: none; border-color: #ff6b9d; }',
    solution:'.styled-form {\n  max-width: 360px;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n.styled-form input {\n  padding: 12px 16px;\n  border: 1px solid #2a2a3e;\n  border-radius: 8px;\n  background: #0f0f1a;\n  color: #e0e0ec;\n  font-size: 14px;\n  outline: none;\n  transition: border-color 0.2s;\n}\n.styled-form input:focus {\n  border-color: #ff6b9d;\n}\n.styled-form button {\n  padding: 12px;\n  background: #ff6b9d;\n  color: #0f0f1a;\n  border: none;\n  border-radius: 8px;\n  font-weight: 700;\n  cursor: pointer;\n}' },
];

// ═══════════════════════════════════════════════
// JS CHALLENGES (10)
// ═══════════════════════════════════════════════

export const JS_CHALLENGES = [
  { id:'js-ch-1', title:'Array Filter & Map', description:'Filter evens, then double each one.', difficulty:'beginner', courseId:'js',
    starter:'const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\n\nconst evens = // filter evens\nconst doubled = // double each\n\nconsole.log(evens);\nconsole.log(doubled);',
    requirements:['Use .filter()','Use .map()','evens = [2,4,6,8,10]','doubled = [4,8,12,16,20]'],
    tests:[
      { label:'.filter()', check:c=>has(c,'.filter(') },
      { label:'.map()', check:c=>has(c,'.map(') },
      { label:'Modulo check', check:c=>has(c,'% 2') },
      { label:'Doubles values', check:c=>has(c,'* 2') },
    ],
    hint:'.filter(n => n % 2 === 0) then .map(n => n * 2)',
    solution:'const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nconst evens = numbers.filter(n => n % 2 === 0);\nconst doubled = evens.map(n => n * 2);\nconsole.log(evens);\nconsole.log(doubled);' },

  { id:'js-ch-2', title:'Object Destructuring', description:'Extract values and merge objects with spread.', difficulty:'beginner', courseId:'js',
    starter:'const user = { name: "Jenna", email: "j@code.com", role: "dev", level: "junior" };\n\n// destructure name and role\n// merge user with { level: "mid", team: "frontend" }',
    requirements:['Destructuring { }','Spread operator ...','Extracts name and role','Merges objects'],
    tests:[
      { label:'Destructuring', check:c=>has(c,'const {')||has(c,'let {') },
      { label:'Spread', check:c=>has(c,'...user')||has(c,'...updates') },
      { label:'Extracts name/role', check:c=>has(c,'name')&&has(c,'role')&&has(c,'} = user') },
      { label:'Merge with spread', check:c=>has(c,'{ ...') },
    ],
    hint:'const { name, role } = user; const merged = { ...user, ...updates };',
    solution:'const user = { name: "Jenna", email: "j@code.com", role: "dev", level: "junior" };\nconst { name, role } = user;\nconst updates = { level: "mid", team: "frontend" };\nconst merged = { ...user, ...updates };\nconsole.log(name, role);\nconsole.log(merged);' },

  { id:'js-ch-3', title:'Async Fetch', description:'Write an async function that fetches data with error handling.', difficulty:'intermediate', courseId:'js',
    starter:'// async function getUser()\n// fetch from jsonplaceholder\n// parse JSON, log name\n// try/catch for errors',
    requirements:['async keyword','await fetch()','Calls .json()','try/catch'],
    tests:[
      { label:'async', check:c=>has(c,'async') },
      { label:'await fetch', check:c=>has(c,'await fetch') },
      { label:'.json()', check:c=>has(c,'.json()') },
      { label:'try/catch', check:c=>has(c,'try')&&has(c,'catch') },
    ],
    hint:'async function getUser() { try { const res = await fetch(url); ... } catch(e) { ... } }',
    solution:'async function getUser() {\n  try {\n    const res = await fetch("https://jsonplaceholder.typicode.com/users/1");\n    const user = await res.json();\n    console.log(user.name);\n  } catch (err) {\n    console.error("Failed:", err.message);\n  }\n}\ngetUser();' },

  { id:'js-ch-4', title:'DOM Counter', description:'Build a counter with increment, decrement, and reset.', difficulty:'beginner', courseId:'js',
    starter:'// Create 3 buttons: +, -, Reset\n// Display the count\n// Use querySelector and addEventListener\n\nlet count = 0;\n\n// Your code here',
    requirements:['Uses querySelector','Uses addEventListener','Has increment/decrement/reset','Updates the display'],
    tests:[
      { label:'querySelector', check:c=>has(c,'querySelector') },
      { label:'addEventListener', check:c=>count(c,'addEventListener')>=2 },
      { label:'Increment logic', check:c=>has(c,'count++') || has(c,'count + 1') || has(c,'count += 1') },
      { label:'Reset to 0', check:c=>has(c,'= 0') },
    ],
    hint:'document.querySelector("#btn").addEventListener("click", () => { count++; display.textContent = count; })',
    solution:'let count = 0;\nconst display = document.querySelector("#count");\nconst plus = document.querySelector("#plus");\nconst minus = document.querySelector("#minus");\nconst reset = document.querySelector("#reset");\n\nplus.addEventListener("click", () => { count++; display.textContent = count; });\nminus.addEventListener("click", () => { count--; display.textContent = count; });\nreset.addEventListener("click", () => { count = 0; display.textContent = count; });' },

  { id:'js-ch-5', title:'localStorage Todo List', description:'Build a todo list that persists with localStorage.', difficulty:'intermediate', courseId:'js',
    starter:'// Todo list with:\n// - Add items\n// - Store in localStorage\n// - Load on page load\n// - Delete items',
    requirements:['Uses localStorage.setItem','Uses localStorage.getItem','Uses JSON.stringify','Uses JSON.parse','Has add and delete functions'],
    tests:[
      { label:'setItem', check:c=>has(c,'setItem') },
      { label:'getItem', check:c=>has(c,'getItem') },
      { label:'JSON.stringify', check:c=>has(c,'JSON.stringify') },
      { label:'JSON.parse', check:c=>has(c,'JSON.parse') },
      { label:'Add/delete logic', check:c=>(has(c,'push')||has(c,'concat'))&&has(c,'filter') },
    ],
    hint:'Save: localStorage.setItem("todos", JSON.stringify(todos)). Load: JSON.parse(localStorage.getItem("todos")) || []',
    solution:'let todos = JSON.parse(localStorage.getItem("todos")) || [];\n\nfunction addTodo(text) {\n  todos.push({ id: Date.now(), text, done: false });\n  save();\n}\n\nfunction deleteTodo(id) {\n  todos = todos.filter(t => t.id !== id);\n  save();\n}\n\nfunction save() {\n  localStorage.setItem("todos", JSON.stringify(todos));\n}\n\naddTodo("Learn JavaScript");\nconsole.log(todos);' },

  { id:'js-ch-6', title:'Array Reduce', description:'Use reduce to calculate total price from a cart array.', difficulty:'beginner', courseId:'js',
    starter:'const cart = [\n  { name: "Shirt", price: 29.99, qty: 2 },\n  { name: "Shoes", price: 89.99, qty: 1 },\n  { name: "Hat", price: 14.99, qty: 3 },\n];\n\n// Calculate total using .reduce()\nconst total = // your code\n\nconsole.log(total);',
    requirements:['Uses .reduce()','Multiplies price * qty','Returns a number','Accumulates correctly'],
    tests:[
      { label:'.reduce()', check:c=>has(c,'.reduce(') },
      { label:'price * qty', check:c=>has(c,'price')&&has(c,'qty')&&has(c,'*') },
      { label:'Has accumulator', check:c=>has(c,', 0')||has(c,',0') },
      { label:'Logs total', check:c=>has(c,'console.log') },
    ],
    hint:'cart.reduce((sum, item) => sum + item.price * item.qty, 0)',
    solution:'const cart = [\n  { name: "Shirt", price: 29.99, qty: 2 },\n  { name: "Shoes", price: 89.99, qty: 1 },\n  { name: "Hat", price: 14.99, qty: 3 },\n];\nconst total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);\nconsole.log(total);' },

  { id:'js-ch-7', title:'Event Delegation', description:'Handle clicks on a dynamic list with one parent listener.', difficulty:'intermediate', courseId:'js',
    starter:'// One listener on #list handles all <li> clicks\n// Use e.target to identify which item was clicked\n// Log the clicked item text',
    requirements:['One addEventListener on parent','Uses e.target','Checks tagName or closest','Handles dynamic children'],
    tests:[
      { label:'addEventListener on parent', check:c=>has(c,'addEventListener') },
      { label:'e.target', check:c=>has(c,'e.target')||has(c,'event.target') },
      { label:'tagName or closest', check:c=>has(c,'tagName')||has(c,'closest')||has(c,'nodeName') },
      { label:'Gets text content', check:c=>has(c,'textContent')||has(c,'innerText') },
    ],
    hint:'list.addEventListener("click", (e) => { if (e.target.tagName === "LI") console.log(e.target.textContent) })',
    solution:'const list = document.querySelector("#list");\n\nlist.addEventListener("click", (e) => {\n  if (e.target.tagName === "LI") {\n    console.log("Clicked:", e.target.textContent);\n    e.target.classList.toggle("done");\n  }\n});' },

  { id:'js-ch-8', title:'Promise Chain', description:'Chain 3 promises that each add to a message.', difficulty:'intermediate', courseId:'js',
    starter:'// Create 3 functions that return promises\n// Chain them: step1().then(step2).then(step3)\n// Each adds to the message',
    requirements:['Creates Promise objects','Uses .then() chaining','3 steps in the chain','Final result logged'],
    tests:[
      { label:'new Promise or returns Promise', check:c=>has(c,'new Promise')||has(c,'Promise.resolve') },
      { label:'.then() chaining', check:c=>count(c,'.then(')>=2 },
      { label:'3 step functions', check:c=>has(c,'step1')||has(c,'function') },
      { label:'console.log result', check:c=>has(c,'console.log') },
    ],
    hint:'function step1() { return Promise.resolve("Hello"); }',
    solution:'function step1() {\n  return Promise.resolve("Hello");\n}\nfunction step2(msg) {\n  return Promise.resolve(msg + " World");\n}\nfunction step3(msg) {\n  return Promise.resolve(msg + "!");\n}\n\nstep1()\n  .then(step2)\n  .then(step3)\n  .then(result => console.log(result));' },

  { id:'js-ch-9', title:'Debounce Function', description:'Implement a debounce utility function.', difficulty:'advanced', courseId:'js',
    starter:'// Write a debounce function\n// debounce(fn, delay) returns a new function\n// that only fires after the user stops calling it\n// for "delay" milliseconds',
    requirements:['Returns a function','Uses setTimeout','Uses clearTimeout','Accepts delay parameter'],
    tests:[
      { label:'Returns function', check:c=>has(c,'return function')||has(c,'return (') },
      { label:'setTimeout', check:c=>has(c,'setTimeout') },
      { label:'clearTimeout', check:c=>has(c,'clearTimeout') },
      { label:'Delay parameter', check:c=>has(c,'delay')||has(c,'wait')||has(c,'ms') },
    ],
    hint:'Store the timer ID. On each call, clear the old timer and set a new one.',
    solution:'function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n\nconst search = debounce((query) => {\n  console.log("Searching:", query);\n}, 300);\n\nsearch("h");\nsearch("he");\nsearch("hello"); // only this fires' },

  { id:'js-ch-10', title:'Class with Inheritance', description:'Create a Shape class and a Circle that extends it.', difficulty:'intermediate', courseId:'js',
    starter:'// Create class Shape with name property\n// Create class Circle extends Shape\n// Circle has radius, calculates area\n// Use super() in constructor',
    requirements:['Uses class keyword','Uses extends','Uses super()','Has a method that calculates area'],
    tests:[
      { label:'class keyword', check:c=>count(c,'class ')>=2 },
      { label:'extends', check:c=>has(c,'extends') },
      { label:'super()', check:c=>has(c,'super(') },
      { label:'Area method', check:c=>has(c,'area')&&has(c,'Math.PI')||has(c,'3.14') },
    ],
    hint:'class Circle extends Shape { constructor(r) { super("Circle"); this.radius = r; } }',
    solution:'class Shape {\n  constructor(name) {\n    this.name = name;\n  }\n  describe() {\n    return `This is a ${this.name}`;\n  }\n}\n\nclass Circle extends Shape {\n  constructor(radius) {\n    super("Circle");\n    this.radius = radius;\n  }\n  area() {\n    return Math.PI * this.radius ** 2;\n  }\n}\n\nconst c = new Circle(5);\nconsole.log(c.describe());\nconsole.log(c.area());' },
];

// ═══════════════════════════════════════════════
// REACT CHALLENGES (10)
// ═══════════════════════════════════════════════

export const REACT_CHALLENGES = [
  { id:'react-ch-1', title:'Counter Component', description:'Build a counter with increment, decrement, and reset using useState.', difficulty:'beginner', courseId:'react',
    starter:'// import useState\n// Build a Counter component\n// 3 buttons: +, -, Reset\n// Display the count',
    requirements:['Imports useState','Uses const [count, setCount]','Has 3 buttons with onClick','Displays count value'],
    tests:[
      { label:'imports useState', check:c=>has(c,'useState') },
      { label:'state declaration', check:c=>has(c,'const [')&&has(c,'useState(') },
      { label:'3 onClick handlers', check:c=>count(c,'onClick')>=3 },
      { label:'Displays count', check:c=>has(c,'{count}') },
    ],
    hint:'const [count, setCount] = useState(0); <button onClick={() => setCount(c => c + 1)}>+</button>',
    solution:'import { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>+</button>\n      <button onClick={() => setCount(c => c - 1)}>-</button>\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}' },

  { id:'react-ch-2', title:'Props Card Component', description:'Create a reusable Card that accepts title, description, and variant props.', difficulty:'beginner', courseId:'react',
    starter:'// Create a Card component\n// Props: title, description, variant\n// Variant changes the border color\n// Destructure props',
    requirements:['Function component','Destructures props','Uses className or style dynamically','Renders title and description'],
    tests:[
      { label:'Function component', check:c=>has(c,'function')&&has(c,'return') },
      { label:'Destructures props', check:c=>has(c,'{ title')||has(c,'{title') },
      { label:'Dynamic class/style', check:c=>has(c,'className={')|| has(c,'style={') },
      { label:'Renders props', check:c=>has(c,'{title}')&&has(c,'{description}') },
    ],
    hint:'function Card({ title, description, variant }) { return <div className={variant}>...</div> }',
    solution:'function Card({ title, description, variant = "default" }) {\n  return (\n    <div className={`card card-${variant}`}>\n      <h3>{title}</h3>\n      <p>{description}</p>\n    </div>\n  );\n}\n\n// Usage:\n// <Card title="Hello" description="World" variant="primary" />' },

  { id:'react-ch-3', title:'Toggle Component', description:'Build a toggle that switches between ON and OFF states.', difficulty:'beginner', courseId:'react',
    starter:'// useState toggle\n// Display ON or OFF\n// Button text changes based on state\n// Style changes based on state',
    requirements:['Uses useState with boolean','Conditional text rendering','onClick toggles state','Dynamic className or style'],
    tests:[
      { label:'useState(false) or useState(true)', check:c=>has(c,'useState(false)')||has(c,'useState(true)') },
      { label:'Ternary for text', check:c=>has(c,'?')&&(has(c,'"ON"')||has(c,"'ON'")||has(c,'on')||has(c,'Off')) },
      { label:'onClick toggles', check:c=>has(c,'onClick')&&(has(c,'!') || has(c,'prev')) },
      { label:'Dynamic styling', check:c=>has(c,'className={') || has(c,'style={') },
    ],
    hint:'const [isOn, setIsOn] = useState(false); onClick={() => setIsOn(prev => !prev)}',
    solution:'import { useState } from "react";\n\nfunction Toggle() {\n  const [isOn, setIsOn] = useState(false);\n  return (\n    <button\n      className={isOn ? "toggle on" : "toggle off"}\n      onClick={() => setIsOn(prev => !prev)}\n    >\n      {isOn ? "ON" : "OFF"}\n    </button>\n  );\n}' },

  { id:'react-ch-4', title:'List with Map & Keys', description:'Render an array of items with .map() and unique keys.', difficulty:'beginner', courseId:'react',
    starter:'// Array of items with id and name\n// Render as a list using .map()\n// Each item needs a unique key\n// Add a delete button per item',
    requirements:['Array state with objects','Uses .map() to render','Each element has key prop','Delete button uses filter'],
    tests:[
      { label:'Array state', check:c=>has(c,'useState([') },
      { label:'.map(', check:c=>has(c,'.map(') },
      { label:'key={', check:c=>has(c,'key={') },
      { label:'filter for delete', check:c=>has(c,'.filter(') },
    ],
    hint:'items.map(item => <li key={item.id}>{item.name} <button onClick={() => delete(item.id)}>X</button></li>)',
    solution:'import { useState } from "react";\n\nfunction ItemList() {\n  const [items, setItems] = useState([\n    { id: 1, name: "Learn React" },\n    { id: 2, name: "Build a project" },\n    { id: 3, name: "Get hired" },\n  ]);\n\n  const remove = (id) => setItems(items.filter(i => i.id !== id));\n\n  return (\n    <ul>\n      {items.map(item => (\n        <li key={item.id}>\n          {item.name}\n          <button onClick={() => remove(item.id)}>X</button>\n        </li>\n      ))}\n    </ul>\n  );\n}' },

  { id:'react-ch-5', title:'Controlled Form', description:'Build a controlled form with name and email that logs on submit.', difficulty:'beginner', courseId:'react',
    starter:'// Controlled inputs with useState\n// value={state} + onChange\n// onSubmit with preventDefault\n// Log form data on submit',
    requirements:['useState for form data','value= on inputs','onChange updates state','onSubmit with preventDefault'],
    tests:[
      { label:'useState', check:c=>has(c,'useState') },
      { label:'value={', check:c=>count(c,'value={')>=2 },
      { label:'onChange', check:c=>count(c,'onChange')>=2 },
      { label:'preventDefault', check:c=>has(c,'preventDefault') },
    ],
    hint:'const [form, setForm] = useState({name:"",email:""}); onChange: setForm({...form, [e.target.name]: e.target.value})',
    solution:'import { useState } from "react";\n\nfunction ContactForm() {\n  const [form, setForm] = useState({ name: "", email: "" });\n\n  const handleChange = (e) => {\n    setForm({ ...form, [e.target.name]: e.target.value });\n  };\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    console.log("Submitted:", form);\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />\n      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />\n      <button type="submit">Send</button>\n    </form>\n  );\n}' },

  { id:'react-ch-6', title:'useEffect Data Fetch', description:'Fetch and display data with loading and error states.', difficulty:'intermediate', courseId:'react',
    starter:'// Fetch users from jsonplaceholder\n// Show loading while fetching\n// Show error if it fails\n// Display user names',
    requirements:['useEffect with empty []','Loading state','Error state','Renders data after fetch'],
    tests:[
      { label:'useEffect', check:c=>has(c,'useEffect') },
      { label:'Loading state', check:c=>has(c,'loading')||has(c,'Loading') },
      { label:'Error handling', check:c=>has(c,'error')||has(c,'catch') },
      { label:'Renders data', check:c=>has(c,'.map(')&&has(c,'key={') },
    ],
    hint:'useEffect(() => { fetch(url).then(r=>r.json()).then(setData).catch(setError).finally(()=>setLoading(false)) }, [])',
    solution:'import { useState, useEffect } from "react";\n\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    fetch("https://jsonplaceholder.typicode.com/users")\n      .then(res => res.json())\n      .then(setUsers)\n      .catch(err => setError(err.message))\n      .finally(() => setLoading(false));\n  }, []);\n\n  if (loading) return <p>Loading...</p>;\n  if (error) return <p>Error: {error}</p>;\n  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n}' },

  { id:'react-ch-7', title:'Context Theme Provider', description:'Create a theme context with toggle and consume it in a component.', difficulty:'intermediate', courseId:'react',
    starter:'// createContext for theme\n// ThemeProvider with useState\n// Toggle function\n// Child component uses useContext',
    requirements:['createContext','Provider with value','useContext in child','Toggle function'],
    tests:[
      { label:'createContext', check:c=>has(c,'createContext') },
      { label:'Provider', check:c=>has(c,'.Provider') },
      { label:'useContext', check:c=>has(c,'useContext') },
      { label:'Toggle logic', check:c=>has(c,'toggle')||has(c,'dark')&&has(c,'light') },
    ],
    hint:'const ThemeContext = createContext(); function ThemeProvider({ children }) { ... return <ThemeContext.Provider value={{theme, toggle}}>',
    solution:'import { createContext, useContext, useState } from "react";\n\nconst ThemeContext = createContext();\n\nfunction ThemeProvider({ children }) {\n  const [theme, setTheme] = useState("dark");\n  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");\n  return (\n    <ThemeContext.Provider value={{ theme, toggle }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n}\n\nfunction Header() {\n  const { theme, toggle } = useContext(ThemeContext);\n  return <button onClick={toggle}>Theme: {theme}</button>;\n}' },

  { id:'react-ch-8', title:'Custom useFetch Hook', description:'Extract data fetching logic into a reusable custom hook.', difficulty:'intermediate', courseId:'react',
    starter:'// Create useFetch(url) hook\n// Returns { data, loading, error }\n// Uses useState + useEffect\n// Use it in a component',
    requirements:['Function starts with "use"','Returns { data, loading, error }','Uses useState and useEffect','Reusable with any URL'],
    tests:[
      { label:'Named useFetch', check:c=>has(c,'function useFetch')||has(c,'const useFetch') },
      { label:'Returns object', check:c=>has(c,'return {')&&has(c,'data')&&has(c,'loading') },
      { label:'useState', check:c=>count(c,'useState')>=2 },
      { label:'useEffect with url dep', check:c=>has(c,'useEffect')&&has(c,'[url]') },
    ],
    hint:'function useFetch(url) { const [data, setData] = useState(null); useEffect(() => { fetch(url)... }, [url]); return { data, loading, error }; }',
    solution:'import { useState, useEffect } from "react";\n\nfunction useFetch(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    setLoading(true);\n    fetch(url)\n      .then(res => res.json())\n      .then(setData)\n      .catch(err => setError(err.message))\n      .finally(() => setLoading(false));\n  }, [url]);\n\n  return { data, loading, error };\n}\n\n// Usage:\n// const { data, loading } = useFetch("/api/users");' },

  { id:'react-ch-9', title:'useReducer Todo', description:'Build a todo app with useReducer for state management.', difficulty:'intermediate', courseId:'react',
    starter:'// useReducer with actions:\n// ADD_TODO, TOGGLE_TODO, DELETE_TODO\n// reducer function with switch\n// dispatch actions from UI',
    requirements:['Uses useReducer','Reducer with switch/case','3+ action types','dispatch() calls'],
    tests:[
      { label:'useReducer', check:c=>has(c,'useReducer') },
      { label:'switch statement', check:c=>has(c,'switch') },
      { label:'3+ action types', check:c=>count(c,"case '")>=3||count(c,'case "')>=3 },
      { label:'dispatch(', check:c=>count(c,'dispatch(')>=2 },
    ],
    hint:'function reducer(state, action) { switch(action.type) { case "ADD": return [...state, action.payload]; } }',
    solution:'import { useReducer } from "react";\n\nfunction reducer(state, action) {\n  switch (action.type) {\n    case "ADD": return [...state, { id: Date.now(), text: action.text, done: false }];\n    case "TOGGLE": return state.map(t => t.id === action.id ? { ...t, done: !t.done } : t);\n    case "DELETE": return state.filter(t => t.id !== action.id);\n    default: return state;\n  }\n}\n\nfunction TodoApp() {\n  const [todos, dispatch] = useReducer(reducer, []);\n  return (\n    <div>\n      <button onClick={() => dispatch({ type: "ADD", text: "New todo" })}>Add</button>\n      {todos.map(t => (\n        <div key={t.id}>\n          <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>\n          <button onClick={() => dispatch({ type: "TOGGLE", id: t.id })}>Toggle</button>\n          <button onClick={() => dispatch({ type: "DELETE", id: t.id })}>Delete</button>\n        </div>\n      ))}\n    </div>\n  );\n}' },

  { id:'react-ch-10', title:'Lazy Loading with Suspense', description:'Code-split a heavy component with React.lazy and Suspense.', difficulty:'advanced', courseId:'react',
    starter:'// Lazy load a component\n// Wrap with Suspense\n// Show fallback while loading\n// Conditionally render',
    requirements:['Uses React.lazy()','Uses Suspense','Has fallback prop','Conditional rendering'],
    tests:[
      { label:'React.lazy or lazy', check:c=>has(c,'lazy(') },
      { label:'Suspense', check:c=>has(c,'Suspense')||has(c,'suspense') },
      { label:'fallback=', check:c=>has(c,'fallback=') },
      { label:'Dynamic import', check:c=>has(c,'import(') },
    ],
    hint:'const Heavy = lazy(() => import("./HeavyComponent")); <Suspense fallback={<p>Loading...</p>}><Heavy /></Suspense>',
    solution:'import { lazy, Suspense, useState } from "react";\n\nconst HeavyChart = lazy(() => import("./HeavyChart"));\n\nfunction App() {\n  const [show, setShow] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setShow(true)}>Load Chart</button>\n      {show && (\n        <Suspense fallback={<p>Loading chart...</p>}>\n          <HeavyChart />\n        </Suspense>\n      )}\n    </div>\n  );\n}' },
];

// ═══════════════════════════════════════════════
// ALL CHALLENGES
// ═══════════════════════════════════════════════

export const CHALLENGES = {
  html: HTML_CHALLENGES,
  css: CSS_CHALLENGES,
  js: JS_CHALLENGES,
  react: REACT_CHALLENGES,
};

export function getChallengesForCourse(courseId) {
  return CHALLENGES[courseId] || [];
}
