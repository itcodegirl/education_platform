export const HTML_QUIZZES = [
{ lessonId:'h1-1', questions:[
  { id:'h1a', type:'mc', question:'What does HTML stand for?', options:['Hyper Tool Markup Language','HyperText Markup Language','Home Text Making Language','HyperText Machine Language'], correct:1, explanation:'HTML = HyperText Markup Language.' },
  { id:'h1b', type:'mc', question:'Is HTML a programming language?', options:['Yes','No — it is a markup language','Only in HTML5','Yes, with JavaScript enabled'], correct:1, explanation:'HTML describes structure. It has no logic, loops, or conditions.' },
  { id:'h1c', type:'mc', question:'What does HTML describe?', options:['Visual design','Behavior','Structure and content','Server logic'], correct:2, explanation:'HTML is the structure. CSS is design. JavaScript is behavior.' },
  { id:'h1d', type:'mc', question:'In the house analogy, HTML is the:', options:['Paint and wallpaper','Electricity','Frame and structure','Furniture'], correct:2, explanation:'HTML = frame, CSS = paint, JavaScript = electricity.' },
  { id:'h1e', type:'mc', question:'Which direction do browsers read HTML?', options:['Bottom to top','Right to left','Top to bottom','Random order'], correct:2, explanation:'Browsers parse HTML sequentially, top to bottom.' },
  { id:'h1f', type:'mc', question:'What does the browser build from HTML?', options:['A stylesheet','The DOM tree','A database','A server'], correct:1, explanation:'The browser creates a Document Object Model from the HTML.' },
  { id:'h1g', type:'mc', question:'Which is NOT something HTML can do?', options:['Create headings','Make a link','Calculate 2+2','Display an image'], correct:2, explanation:'Calculations require JavaScript. HTML only describes content.' },
]},

{ lessonId:'h1-2', questions:[
  { id:'h2a', type:'mc', question:'What does DOM stand for?', options:['Document Object Model','Data Object Mapping','Document Order Method','Dynamic Object Model'], correct:0, explanation:'DOM = Document Object Model — the browser\'s tree of elements.' },
  { id:'h2b', type:'mc', question:'The DOM is a __ of every HTML element.', options:['Copy','Tree','Database','Image'], correct:1, explanation:'The DOM is a tree structure with parent-child relationships.' },
  { id:'h2c', type:'mc', question:'If you edit the DOM in DevTools, what happens on refresh?', options:['Changes are saved','Changes disappear','The file is updated','An error occurs'], correct:1, explanation:'DOM edits are temporary — refreshing reloads from the original HTML file.' },
  { id:'h2d', type:'mc', question:'What does JavaScript interact with?', options:['The CSS file directly','The DOM','The server only','The HTML file on disk'], correct:1, explanation:'JavaScript manipulates the live DOM, not the HTML source file.' },
  { id:'h2e', type:'mc', question:'What happens if your HTML has errors?', options:['The browser crashes','The browser tries to fix them silently','Nothing loads','An alert appears'], correct:1, explanation:'Browsers auto-correct many HTML errors, which can cause subtle bugs.' },
  { id:'h2f', type:'mc', question:'Where can you see the DOM?', options:['In the HTML file','In the Console tab','In the Elements tab of DevTools','In the URL bar'], correct:2, explanation:'The Elements tab in DevTools shows the live DOM tree.' },
  { id:'h2g', type:'mc', question:'The DOM represents HTML as a:', options:['Flat list','Spreadsheet','Tree with nested nodes','Single string'], correct:2, explanation:'html → head + body → nested elements form a tree structure.' },
]},

{ lessonId:'h2-1', questions:[
  { id:'h3a', type:'mc', question:'What does the ! + Tab shortcut do in VS Code?', options:['Opens terminal','Generates an HTML5 skeleton','Saves the file','Creates a new folder'], correct:1, explanation:'Emmet abbreviation ! + Tab generates a full HTML boilerplate.' },
  { id:'h3b', type:'mc', question:'Which VS Code extension previews your site in the browser?', options:['Prettier','Auto Rename Tag','Live Server','ESLint'], correct:2, explanation:'Live Server auto-opens and refreshes your site on save.' },
  { id:'h3c', type:'mc', question:'What is the correct file extension for HTML?', options:['.htm','html','Both .html and .htm work','.web'], correct:2, explanation:'Both .html and .htm are valid, but .html is the standard.' },
  { id:'h3d', type:'mc', question:'Where should you save project files?', options:['Desktop randomly','A dedicated project folder','Downloads','System32'], correct:1, explanation:'Always work in an organized project folder.' },
  { id:'h3e', type:'mc', question:'Which extension auto-formats your code?', options:['Live Server','Prettier','Auto Rename Tag','Path Intellisense'], correct:1, explanation:'Prettier automatically formats code on save.' },
  { id:'h3f', type:'mc', question:'What does Emmet do?', options:['Runs JavaScript','Expands shortcuts into full HTML','Validates code','Deploys websites'], correct:1, explanation:'Emmet expands abbreviations like ul>li*3 into full HTML.' },
  { id:'h3g', type:'mc', question:'Why use VS Code over Notepad?', options:['Syntax highlighting, extensions, and autocomplete','It is faster','It is required for HTML','Notepad cannot save .html files'], correct:0, explanation:'VS Code provides productivity features that plain text editors lack.' },
]},

{ lessonId:'h2-2', questions:[
  { id:'h4a', type:'mc', question:'How do you open DevTools?', options:['File menu','F12 or right-click → Inspect','Ctrl+S','Alt+Tab'], correct:1, explanation:'F12 or right-click → Inspect opens browser DevTools.' },
  { id:'h4b', type:'mc', question:'Which tab shows loaded files (CSS, JS, images)?', options:['Elements','Console','Network','Sources'], correct:2, explanation:'The Network tab shows every resource the page loads.' },
  { id:'h4c', type:'mc', question:'What does Responsive Mode do?', options:['Speeds up the page','Simulates different screen sizes','Adds CSS automatically','Creates mobile version'], correct:1, explanation:'Responsive Mode lets you test how pages look on phones/tablets.' },
  { id:'h4d', type:'mc', question:'Can DevTools edits break the real website?', options:['Yes permanently','No — changes are temporary and local','Only on your computer','Only if you save'], correct:1, explanation:'DevTools changes are in-memory only and reset on refresh.' },
  { id:'h4e', type:'mc', question:'Which tab shows JavaScript errors?', options:['Elements','Console','Network','Application'], correct:1, explanation:'The Console tab displays errors, warnings, and log output.' },
  { id:'h4f', type:'mc', question:'What does the box model diagram show?', options:['Font sizes','Content + padding + border + margin','Colors used','JavaScript variables'], correct:1, explanation:'The box model shows the four layers around every element.' },
  { id:'h4g', type:'mc', question:'You can edit CSS in DevTools and:', options:['It saves to the file','See live changes (temporary)','Break the server','Nothing happens'], correct:1, explanation:'DevTools CSS changes are live but temporary.' },
]},

{ lessonId:'h3-1', questions:[
  { id:'h5a', type:'mc', question:'What must be the first line of every HTML5 file?', options:['<html>','<head>','<!DOCTYPE html>','<body>'], correct:2, explanation:'<!DOCTYPE html> tells the browser this is an HTML5 document.' },
  { id:'h5b', type:'mc', question:'What does <html lang="en"> do?', options:['Sets the font','Declares the page language','Enables JavaScript','Links CSS'], correct:1, explanation:'The lang attribute helps screen readers and search engines.' },
  { id:'h5c', type:'mc', question:'Which section is invisible to visitors?', options:['<body>','<head>','<main>','<footer>'], correct:1, explanation:'<head> contains metadata that browsers use but visitors don\'t see.' },
  { id:'h5d', type:'mc', question:'Where does visible content go?', options:['<head>','<meta>','<body>','<title>'], correct:2, explanation:'Everything inside <body> is what users see on the page.' },
  { id:'h5e', type:'mc', question:'What does <title> control?', options:['The h1 on the page','The browser tab text','The URL','The font'], correct:1, explanation:'<title> sets the text shown in the browser tab and search results.' },
  { id:'h5f', type:'mc', question:'What happens without <!DOCTYPE html>?', options:['Page won\'t load','Browser enters quirks mode (unpredictable rendering)','CSS breaks','Nothing'], correct:1, explanation:'Without DOCTYPE, browsers render in quirks mode with inconsistent behavior.' },
  { id:'h5g', type:'mc', question:'How many <body> elements should a page have?', options:['As many as needed','Exactly one','At least two','None'], correct:1, explanation:'One <body> per page — it contains all visible content.' },
]},

{ lessonId:'h3-2', questions:[
  { id:'h6a', type:'mc', question:'What does <meta charset="UTF-8"> do?', options:['Sets the font','Ensures special characters display correctly','Links a stylesheet','Sets the language'], correct:1, explanation:'UTF-8 encoding handles accented characters, emojis, and symbols.' },
  { id:'h6b', type:'mc', question:'Which meta tag makes pages responsive on mobile?', options:['charset','description','viewport','author'], correct:2, explanation:'The viewport meta tag enables responsive sizing on mobile devices.' },
  { id:'h6c', type:'mc', question:'Where do CSS links go?', options:['In <body>','In <head>','After </html>','In <footer>'], correct:1, explanation:'<link rel="stylesheet"> goes in <head> so CSS loads before content renders.' },
  { id:'h6d', type:'mc', question:'What does the defer attribute do on a script tag?', options:['Deletes the script','Loads JS after HTML is fully parsed','Makes it faster','Blocks rendering'], correct:1, explanation:'defer ensures JavaScript doesn\'t block HTML parsing.' },
  { id:'h6e', type:'mc', question:'What does <meta name="description"> do?', options:['Appears on the page','Sets the search result snippet text','Changes the title','Adds keywords for Google'], correct:1, explanation:'The description meta tag controls the snippet shown in search results.' },
  { id:'h6f', type:'mc', question:'What is a favicon?', options:['A large hero image','The small icon in the browser tab','A font file','A CSS variable'], correct:1, explanation:'Favicon is the small icon shown in the browser tab next to the title.' },
  { id:'h6g', type:'mc', question:'What goes wrong if you put <p> inside <head>?', options:['Nothing','It appears in a wrong/unexpected location','The page crashes','It becomes invisible'], correct:1, explanation:'<head> is for metadata. Content elements render unpredictably there.' },
]},

{ lessonId:'h4-1', questions:[
  { id:'h7a', type:'mc', question:'Which element is self-closing?', options:['<p>','<div>','<img />','<a>'], correct:2, explanation:'<img /> has no content between tags — it\'s self-closing.' },
  { id:'h7b', type:'mc', question:'What is wrong with: <p><div>text</div></p>?', options:['Nothing','Block element inside inline/paragraph is invalid','Missing class','Needs an id'], correct:1, explanation:'<div> is block-level and cannot be nested inside <p> (inline context).' },
  { id:'h7c', type:'mc', question:'Which are all self-closing elements?', options:['<img>, <br>, <input>, <hr>','<p>, <div>, <span>','<a>, <img>, <video>','<ul>, <li>, <ol>'], correct:0, explanation:'img, br, input, and hr have no content — they\'re self-closing.' },
  { id:'h7d', type:'mc', question:'What does proper nesting look like?', options:['<b><i>text</b></i>','<b><i>text</i></b>','<b><i>text</b>','<b>text<i></b></i>'], correct:1, explanation:'Elements must close in reverse order: last opened = first closed.' },
  { id:'h7e', type:'mc', question:'What does indentation do in HTML?', options:['Changes the layout','Makes code readable (no effect on rendering)','Adds padding','Is required by browsers'], correct:1, explanation:'Indentation is for humans only — browsers ignore whitespace.' },
  { id:'h7f', type:'mc', question:'How many closing tags does <br /> need?', options:['One','Zero — it is self-closing','Two','Depends on context'], correct:1, explanation:'Self-closing elements have no separate closing tag.' },
  { id:'h7g', type:'mc', question:'What happens if you forget a closing tag?', options:['Error message','Browser guesses where to close it (possibly wrong)','Page crashes','Nothing'], correct:1, explanation:'Browsers auto-close unclosed tags, often in unexpected places.' },
]},

{ lessonId:'h4-2', questions:[
  { id:'h8a', type:'mc', question:'Where do attributes go?', options:['After the closing tag','Inside the opening tag','In the CSS','In a separate file'], correct:1, explanation:'Attributes are written inside the opening tag: <tag attr="value">.' },
  { id:'h8b', type:'mc', question:'What does the alt attribute do on images?', options:['Sets the URL','Describes the image for accessibility','Adds a border','Changes the size'], correct:1, explanation:'alt provides text for screen readers and when images fail to load.' },
  { id:'h8c', type:'mc', question:'What is the difference between class and id?', options:['No difference','class is reusable, id is unique per page','id is reusable, class is unique','class is for CSS, id is for HTML'], correct:1, explanation:'class can be used on multiple elements. id must be unique.' },
  { id:'h8d', type:'mc', question:'Which attribute sets a link destination?', options:['src','alt','href','target'], correct:2, explanation:'href (hypertext reference) sets where a link goes.' },
  { id:'h8e', type:'mc', question:'What format should attribute values use?', options:['Single quotes only','Double quotes (recommended)','No quotes needed','Backticks'], correct:1, explanation:'Double quotes are the standard: attribute="value".' },
  { id:'h8f', type:'mc', question:'What does target="_blank" do?', options:['Makes link bold','Opens link in a new tab','Targets a class','Disables the link'], correct:1, explanation:'target="_blank" opens the linked page in a new browser tab.' },
  { id:'h8g', type:'mc', question:'What is a data attribute?', options:['Required on all elements','Custom data stored on an element (data-*)','A CSS property','A JavaScript variable'], correct:1, explanation:'data-* attributes store custom data that JavaScript can access.' },
]},

{ lessonId:'h5-1', questions:[
  { id:'h9a', type:'mc', question:'How many <h1> tags should a page have?', options:['As many as needed','Exactly one','At least three','None'], correct:1, explanation:'One <h1> per page for accessibility and SEO.' },
  { id:'h9b', type:'mc', question:'What is wrong with going h1 → h3 (skipping h2)?', options:['Nothing','It breaks the heading hierarchy for screen readers','h3 won\'t render','The page crashes'], correct:1, explanation:'Skipping heading levels confuses screen readers and hurts accessibility.' },
  { id:'h9c', type:'mc', question:'Which is the smallest heading?', options:['<h1>','<h3>','<h6>','<h4>'], correct:2, explanation:'<h6> is the smallest/least important. <h1> is the largest/most important.' },
  { id:'h9d', type:'mc', question:'What is <p> used for?', options:['Pictures','Paragraphs of text','Pages','Padding'], correct:1, explanation:'<p> creates a paragraph — the most common text element.' },
  { id:'h9e', type:'mc', question:'Should you use headings just to make text big?', options:['Yes, that is their purpose','No — use CSS for sizing, headings for hierarchy','Only h1','It depends on the font'], correct:1, explanation:'Headings define document structure, not visual size.' },
  { id:'h9f', type:'mc', question:'What do screen readers use headings for?', options:['Nothing','Navigation — users can jump between headings','Styling','Loading content'], correct:1, explanation:'Screen reader users navigate by heading level to find content.' },
  { id:'h9g', type:'mc', question:'Which is correct heading order?', options:['h1, h3, h2, h4','h1, h2, h3','h2, h1, h3','h3, h2, h1'], correct:1, explanation:'Headings must be sequential: h1 → h2 → h3, no skipping.' },
]},


{ lessonId:'h5-2', questions:[
  { id:'h10a', type:'mc', question:'What does <strong> do?', options:['Just makes text bold','Bolds text AND conveys importance to screen readers','Italicizes text','Underlines text'], correct:1, explanation:'<strong> is semantic — screen readers emphasize it. <b> is just visual.' },
  { id:'h10b', type:'mc', question:'What does <em> do?', options:['Makes text bigger','Italicizes AND conveys emphasis','Strikes through text','Makes text red'], correct:1, explanation:'<em> provides emphasis that screen readers detect.' },
  { id:'h10c', type:'mc', question:'What does <mark> do?', options:['Creates a bookmark','Highlights text','Marks text for deletion','Adds a margin'], correct:1, explanation:'<mark> visually highlights text with a background color.' },
  { id:'h10d', type:'mc', question:'How do you write H₂O in HTML?', options:['H<sub>2</sub>O','H<sup>2</sup>O','H{2}O','H_2_O'], correct:0, explanation:'<sub> creates subscript text for chemical formulas.' },
  { id:'h10e', type:'mc', question:'What does <hr /> create?', options:['A heading','A horizontal line/divider','A hyperlink','A hidden element'], correct:1, explanation:'<hr /> draws a horizontal rule — a section divider.' },
  { id:'h10f', type:'mc', question:'Why use <strong> instead of <b>?', options:['They are identical','<strong> has semantic meaning for assistive tech','<b> is deprecated','<strong> is newer'], correct:1, explanation:'Screen readers understand <strong> as important. <b> is just visual.' },
  { id:'h10g', type:'mc', question:'What does <small> do?', options:['Makes the whole page smaller','Makes text smaller (fine print)','Removes text','Adds padding'], correct:1, explanation:'<small> is for side comments, fine print, or legal text.' },
]},

{ lessonId:'h5-3', questions:[
  { id:'h11a', type:'mc', question:'What does &lt; display?', options:['Greater than >','Less than <','Ampersand &','Copyright ©'], correct:1, explanation:'&lt; is the HTML entity for the less-than symbol <.' },
  { id:'h11b', type:'mc', question:'Why do you need &amp; instead of just &?', options:['Style preference','& is a reserved character in HTML','& doesn\'t render','& creates a link'], correct:1, explanation:'& starts entity codes, so bare & in content can cause parsing issues.' },
  { id:'h11c', type:'mc', question:'What does &copy; display?', options:['A checkmark','The copyright symbol ©','A registered trademark','A bullet point'], correct:1, explanation:'&copy; renders the © symbol.' },
  { id:'h11d', type:'mc', question:'What does &nbsp; create?', options:['A line break','A non-breaking space','A bullet','A tab'], correct:1, explanation:'&nbsp; prevents the browser from collapsing multiple spaces into one.' },
  { id:'h11e', type:'mc', question:'If you type <p> in a paragraph, what happens?', options:['It shows as text','It creates an actual paragraph element','An error occurs','Nothing'], correct:1, explanation:'< starts an HTML tag. Use &lt;p&gt; to display the characters.' },
  { id:'h11f', type:'mc', question:'What does &mdash; display?', options:['A minus sign','An em dash —','A hyphen','An underscore'], correct:1, explanation:'&mdash; creates a long dash (em dash) used in punctuation.' },
  { id:'h11g', type:'mc', question:'Which entity shows a double quote inside an attribute?', options:['&amp;','&lt;','&quot;','&copy;'], correct:2, explanation:'&quot; displays " without conflicting with attribute quote marks.' },
]},

{ lessonId:'h6-1', questions:[
  { id:'h12a', type:'mc', question:'What does <a href="..."> create?', options:['An image','A hyperlink','An anchor point','An address'], correct:1, explanation:'The <a> tag with href creates a clickable hyperlink.' },
  { id:'h12b', type:'mc', question:'What is a relative URL?', options:['Points to a full web address','Points to a file in your own project','Always starts with https','Only works on localhost'], correct:1, explanation:'Relative URLs like ./about.html reference files relative to the current file.' },
  { id:'h12c', type:'mc', question:'What does <a href="#contact"> do?', options:['Opens contact.html','Jumps to element with id="contact" on the same page','Sends an email','Opens a phone dialer'], correct:1, explanation:'# creates an anchor link to an element with matching id.' },
  { id:'h12d', type:'mc', question:'What does mailto: do in a link?', options:['Opens a map','Opens the user\'s email client','Sends a text message','Navigates to a mail server'], correct:1, explanation:'mailto: opens the default email app with the address pre-filled.' },
  { id:'h12e', type:'mc', question:'Why add rel="noopener noreferrer" to _blank links?', options:['SEO boost','Security — prevents the new page from accessing your window','Faster loading','Required by HTML5'], correct:1, explanation:'Without it, the new page could potentially access your page\'s window object.' },
  { id:'h12f', type:'mc', question:'What is the difference between absolute and relative URLs?', options:['No difference','Absolute = full address, relative = within your project','Absolute = faster','Relative = external sites only'], correct:1, explanation:'Absolute: https://example.com/page. Relative: ./page.html.' },
  { id:'h12g', type:'mc', question:'What does tel: do in an href?', options:['Opens a terminal','Triggers a phone call on mobile','Sends a telegram','Nothing on desktop'], correct:1, explanation:'tel: links trigger the phone dialer on mobile devices.' },
]},

{ lessonId:'h7-1', questions:[
  { id:'h13a', type:'mc', question:'Is alt required on <img>?', options:['No, it is optional','Yes — for accessibility and broken images','Only for decorative images','Only for SEO'], correct:1, explanation:'alt is required. Empty alt="" means decorative only.' },
  { id:'h13b', type:'mc', question:'What does width and height on <img> prevent?', options:['Slow loading','Layout shift while the image loads','Stretching','Nothing'], correct:1, explanation:'Setting dimensions reserves space so the page doesn\'t jump when images load.' },
  { id:'h13c', type:'mc', question:'What does <figure> with <figcaption> do?', options:['Creates a form','Groups an image with its caption semantically','Makes images responsive','Adds a border'], correct:1, explanation:'<figure> + <figcaption> semantically associates an image with its description.' },
  { id:'h13d', type:'mc', question:'Which image format supports transparency?', options:['JPG','PNG','BMP','TIFF'], correct:1, explanation:'PNG supports transparency (alpha channel). JPG does not.' },
  { id:'h13e', type:'mc', question:'Which format is best for photos?', options:['PNG','SVG','JPG or WebP','GIF'], correct:2, explanation:'JPG and WebP compress photos efficiently. PNG is better for graphics.' },
  { id:'h13f', type:'mc', question:'What does loading="lazy" do?', options:['Makes image blurry','Loads the image only when near the viewport','Slows down the image','Reduces quality'], correct:1, explanation:'Lazy loading defers image download until the user scrolls near it.' },
  { id:'h13g', type:'mc', question:'What is SVG best for?', options:['Photos','Scalable graphics, icons, and logos','Videos','Audio'], correct:1, explanation:'SVG is vector-based — it scales to any size without pixelation.' },
]},

{ lessonId:'h7-2', questions:[
  { id:'h14a', type:'mc', question:'What does <video controls> do?', options:['Plays automatically','Shows play/pause/volume controls','Makes video fullscreen','Mutes the video'], correct:1, explanation:'The controls attribute adds a native video player UI.' },
  { id:'h14b', type:'mc', question:'Why use <source> inside <video>?', options:['It is required','Provides multiple formats for browser compatibility','Adds subtitles','Improves quality'], correct:1, explanation:'Different browsers support different formats. <source> provides fallbacks.' },
  { id:'h14c', type:'mc', question:'What element embeds a YouTube video?', options:['<video>','<embed>','<iframe>','<youtube>'], correct:2, explanation:'<iframe> embeds external content like YouTube videos or maps.' },
  { id:'h14d', type:'mc', question:'What happens with autoplay but no muted?', options:['It works fine','Most browsers block it — autoplay requires muted','It plays louder','An error occurs'], correct:1, explanation:'Browsers block unmuted autoplay to protect user experience.' },
  { id:'h14e', type:'mc', question:'What is the fallback text inside <video> for?', options:['Subtitles','Shows when the browser doesn\'t support video','Alt text','A description'], correct:1, explanation:'Text between <video> tags displays if the browser can\'t play video.' },
  { id:'h14f', type:'mc', question:'What does the loop attribute do?', options:['Loops the page','Replays the video/audio continuously','Creates a loop animation','Nothing'], correct:1, explanation:'loop makes the media replay when it reaches the end.' },
  { id:'h14g', type:'mc', question:'<iframe> can embed which of these?', options:['Only YouTube','Only maps','YouTube, maps, and any external site','Only internal pages'], correct:2, explanation:'<iframe> can embed any accessible web content.' },
]},

{ lessonId:'h8-1', questions:[
  { id:'h15a', type:'mc', question:'Which list type uses bullets?', options:['<ol>','<ul>','<dl>','<bl>'], correct:1, explanation:'<ul> (unordered list) creates bullet points.' },
  { id:'h15b', type:'mc', question:'When should you use <ol>?', options:['For any list','When order matters (steps, rankings)','For definitions','For navigation'], correct:1, explanation:'Ordered lists are for sequences where position matters.' },
  { id:'h15c', type:'mc', question:'What is <dl> for?', options:['Download links','Definition lists with terms and descriptions','Dynamic lists','Disabled lists'], correct:1, explanation:'<dl> with <dt> (term) and <dd> (definition) creates glossary-style lists.' },
  { id:'h15d', type:'mc', question:'Can you nest lists inside lists?', options:['No','Yes — put a <ul> or <ol> inside an <li>','Only <ul> inside <ol>','Only one level deep'], correct:1, explanation:'Lists can nest indefinitely — put the inner list inside a <li>.' },
  { id:'h15e', type:'mc', question:'What is wrong with text directly inside <ul> (no <li>)?', options:['Nothing','<li> is required for list items','It creates bold text','It adds bullets'], correct:1, explanation:'<ul> expects <li> children. Bare text is invalid.' },
  { id:'h15f', type:'mc', question:'What tag wraps each item in any list?', options:['<item>','<li>','<dt>','<entry>'], correct:1, explanation:'<li> (list item) is used inside both <ul> and <ol>.' },
  { id:'h15g', type:'mc', question:'<dt> and <dd> are children of:', options:['<ul>','<ol>','<dl>','<table>'], correct:2, explanation:'<dt> (term) and <dd> (definition) belong inside <dl>.' },
]},

{ lessonId:'h9-1', questions:[
  { id:'h16a', type:'mc', question:'Should tables be used for page layout?', options:['Yes, it is common','No — tables are for data only','Only on mobile','Only with CSS Grid'], correct:1, explanation:'Tables are strictly for tabular data. Use CSS for layout.' },
  { id:'h16b', type:'mc', question:'What does <thead> contain?', options:['Table data','Table header row(s) with <th> cells','Table caption','Table footer'], correct:1, explanation:'<thead> wraps the header row containing <th> column headings.' },
  { id:'h16c', type:'mc', question:'What is the difference between <th> and <td>?', options:['No difference','<th> is a header cell (bold), <td> is a data cell','<th> is for tables, <td> is for divs','<td> is header, <th> is data'], correct:1, explanation:'<th> = header cell (bold, centered by default). <td> = data cell.' },
  { id:'h16d', type:'mc', question:'What does colspan="2" do?', options:['Creates 2 columns','Makes a cell span across 2 columns','Adds 2px spacing','Creates 2 rows'], correct:1, explanation:'colspan makes a single cell stretch across multiple columns.' },
  { id:'h16e', type:'mc', question:'What goes inside <tbody>?', options:['Header rows','Data rows','Footer rows','Captions'], correct:1, explanation:'<tbody> contains the data rows of the table.' },
  { id:'h16f', type:'mc', question:'What creates a table row?', options:['<td>','<tr>','<row>','<line>'], correct:1, explanation:'<tr> (table row) creates a horizontal row of cells.' },
  { id:'h16g', type:'mc', question:'What is the correct table hierarchy?', options:['table > td > tr','table > thead > tr > th','table > th > tr > td','tr > table > th'], correct:1, explanation:'table → thead/tbody → tr → th/td. Rows contain cells.' },
]},


{ lessonId:'h10-1', questions:[
  { id:'h17a', type:'mc', question:'Which element marks the primary content?', options:['<div>','<main>','<section>','<content>'], correct:1, explanation:'<main> marks the primary content — used once per page.' },
  { id:'h17b', type:'mc', question:'What does <nav> represent?', options:['A numbered list','A navigation section with links','A new paragraph','A nested div'], correct:1, explanation:'<nav> identifies a group of navigation links.' },
  { id:'h17c', type:'mc', question:'Why use <article> instead of <div>?', options:['Faster rendering','<article> signals self-contained content to screen readers and search engines','It adds styling','No reason'], correct:1, explanation:'<article> has semantic meaning. <div> has none.' },
  { id:'h17d', type:'mc', question:'What is <aside> for?', options:['Main content','Secondary/sidebar content','Invisible metadata','Scripts'], correct:1, explanation:'<aside> is for content tangentially related to the main content.' },
  { id:'h17e', type:'mc', question:'How does semantic HTML help SEO?', options:['It doesn\'t','Search engines understand page structure better','It adds keywords','It speeds up loading'], correct:1, explanation:'Search engines use semantic tags to understand content hierarchy.' },
  { id:'h17f', type:'mc', question:'Can you have multiple <section> elements?', options:['No, only one','Yes — each groups related content with a heading','Only inside <main>','Only two'], correct:1, explanation:'Multiple <section> elements organize different thematic groups.' },
  { id:'h17g', type:'mc', question:'What is "div soup"?', options:['A CSS framework','Overusing <div> where semantic elements should be used','A testing library','A design pattern'], correct:1, explanation:'Div soup = using divs for everything instead of meaningful semantic tags.' },
]},

{ lessonId:'h10-2', questions:[
  { id:'h18a', type:'mc', question:'What does <details>/<summary> create?', options:['A download link','Expandable/collapsible content without JavaScript','A modal dialog','An alert'], correct:1, explanation:'Native HTML accordion — no JavaScript required.' },
  { id:'h18b', type:'mc', question:'What does <time datetime="2025-03-15"> do?', options:['Displays a timer','Provides machine-readable date information','Creates a countdown','Schedules an event'], correct:1, explanation:'<time> with datetime gives browsers/search engines a parseable date.' },
  { id:'h18c', type:'mc', question:'What is <address> for?', options:['Physical street addresses only','Contact information for the page/article author','GPS coordinates','Mailing labels'], correct:1, explanation:'<address> marks up contact info — email, phone, social, or physical address.' },
  { id:'h18d', type:'mc', question:'Which element is <summary> required inside?', options:['<section>','<details>','<dialog>','<nav>'], correct:1, explanation:'<summary> provides the clickable label inside a <details> element.' },
  { id:'h18e', type:'mc', question:'Can <details> be open by default?', options:['No','Yes — add the open attribute','Only with JavaScript','Only in Chrome'], correct:1, explanation:'<details open> starts in the expanded state.' },
  { id:'h18f', type:'mc', question:'What did developers use before <details>?', options:['Nothing','Custom JavaScript accordion components','Tables','Iframes'], correct:1, explanation:'Before <details>, expandable content required JavaScript to toggle visibility.' },
  { id:'h18g', type:'mc', question:'Is <dialog> supported in all browsers?', options:['Yes since HTML4','Yes in all modern browsers','No, only Chrome','Only with polyfill'], correct:1, explanation:'<dialog> is supported in all modern browsers as of 2022.' },
]},

{ lessonId:'h11-1', questions:[
  { id:'h19a', type:'mc', question:'Is <div> block or inline?', options:['Inline','Block','Both','Neither'], correct:1, explanation:'<div> is block-level — takes full width and starts a new line.' },
  { id:'h19b', type:'mc', question:'Is <span> block or inline?', options:['Block','Inline','Both','Neither'], correct:1, explanation:'<span> is inline — only as wide as its content, stays in text flow.' },
  { id:'h19c', type:'mc', question:'When should you use <div>?', options:['For every element','Only when no semantic element fits','For text formatting','For headings'], correct:1, explanation:'Use semantic elements first. <div> is a last resort for grouping.' },
  { id:'h19d', type:'mc', question:'What should you use instead of <div class="nav">?', options:['<span class="nav">','<nav>','<navigation>','<menu>'], correct:1, explanation:'<nav> is the semantic element for navigation sections.' },
  { id:'h19e', type:'mc', question:'Can you style both <div> and <span> with CSS?', options:['Only <div>','Only <span>','Yes, both','No'], correct:2, explanation:'Both are styleable — div for block containers, span for inline styling.' },
  { id:'h19f', type:'mc', question:'What is the main purpose of <span>?', options:['Create sections','Style or target a small piece of text within a paragraph','Replace <div>','Create links'], correct:1, explanation:'<span> wraps inline text for CSS styling or JavaScript targeting.' },
  { id:'h19g', type:'mc', question:'A block element:', options:['Stays on the same line','Takes full width and starts on a new line','Is always invisible','Cannot have children'], correct:1, explanation:'Block elements take the full available width and force a new line.' },
]},

{ lessonId:'h12-1', questions:[
  { id:'h20a', type:'mc', question:'Why is <label> important for accessibility?', options:['Styling only','Screen readers announce what each input is for','Performance','It is optional'], correct:1, explanation:'Labels connect to inputs so screen readers can identify form fields.' },
  { id:'h20b', type:'mc', question:'How does <label for="x"> connect to an input?', options:['By class name','By matching the input\'s id attribute','By position','Automatically'], correct:1, explanation:'for="x" connects to <input id="x"> — they must match.' },
  { id:'h20c', type:'mc', question:'What does <fieldset> do?', options:['Filters fields','Groups related form fields together','Creates a grid','Sets field width'], correct:1, explanation:'<fieldset> groups related inputs, <legend> provides a caption.' },
  { id:'h20d', type:'mc', question:'What does the action attribute on <form> do?', options:['Triggers JavaScript','Sets where form data is sent on submit','Styles the form','Validates inputs'], correct:1, explanation:'action="url" tells the browser where to send the form data.' },
  { id:'h20e', type:'mc', question:'What does method="POST" mean?', options:['Data appears in the URL','Data is sent in the request body (hidden from URL)','Data is saved locally','Data is deleted'], correct:1, explanation:'POST sends data in the body. GET appends it to the URL.' },
  { id:'h20f', type:'mc', question:'What happens if you click a <label> connected to a checkbox?', options:['Nothing','The checkbox toggles','The label changes color','The form submits'], correct:1, explanation:'Clicking a connected label activates its input — toggles checkboxes, focuses text inputs.' },
  { id:'h20g', type:'mc', question:'What element creates the form submit button?', options:['<input type="submit">','<button type="submit">','Both work','<submit>'], correct:2, explanation:'Both <input type="submit"> and <button type="submit"> create submit buttons.' },
]},

{ lessonId:'h12-2', questions:[
  { id:'h21a', type:'mc', question:'Why use type="email" instead of type="text"?', options:['They are the same','Email shows @ on mobile keyboard and validates format','Email encrypts data','Email auto-fills'], correct:1, explanation:'type="email" provides mobile keyboard optimization and format validation.' },
  { id:'h21b', type:'mc', question:'Radio buttons with the same name attribute:', options:['Can all be selected','Allow only ONE to be selected at a time','Are disabled','Are hidden'], correct:1, explanation:'Same name groups radios together — selecting one deselects the others.' },
  { id:'h21c', type:'mc', question:'What does <select> create?', options:['A checkbox','A dropdown menu','A text area','A file picker'], correct:1, explanation:'<select> with <option> elements creates a dropdown menu.' },
  { id:'h21d', type:'mc', question:'What does type="file" do?', options:['Creates a text field','Opens a file upload dialog','Downloads a file','Creates a link'], correct:1, explanation:'type="file" lets users select and upload files from their device.' },
  { id:'h21e', type:'mc', question:'What does type="date" show on mobile?', options:['A text field','A native date picker','A calendar image','Nothing special'], correct:1, explanation:'type="date" triggers the device\'s native date picker.' },
  { id:'h21f', type:'mc', question:'Checkboxes allow:', options:['Single selection','Multiple selections','No selection','Radio selection'], correct:1, explanation:'Checkboxes are independent — users can check multiple options.' },
  { id:'h21g', type:'mc', question:'What does <textarea> create?', options:['Single line input','Multi-line text area','A table cell','A code editor'], correct:1, explanation:'<textarea> creates a resizable multi-line text input.' },
]},

{ lessonId:'h12-3', questions:[
  { id:'h22a', type:'mc', question:'What does required do?', options:['Adds a red border','Prevents form submission if the field is empty','Makes field bold','Sends data to server'], correct:1, explanation:'required triggers browser validation — the form won\'t submit until filled.' },
  { id:'h22b', type:'mc', question:'What does placeholder do?', options:['Sets the default value','Shows hint text that disappears when typing','Replaces the label','Validates input'], correct:1, explanation:'Placeholder is hint text inside the input — not a replacement for <label>.' },
  { id:'h22c', type:'mc', question:'Is placeholder a replacement for <label>?', options:['Yes','No — labels are required for accessibility','Sometimes','On mobile only'], correct:1, explanation:'Placeholder disappears on focus. Labels always stay visible to screen readers.' },
  { id:'h22d', type:'mc', question:'What does minlength="8" do?', options:['Sets font size','Requires at least 8 characters to submit','Limits to 8 characters','Adds 8px padding'], correct:1, explanation:'minlength requires a minimum number of characters.' },
  { id:'h22e', type:'mc', question:'What does the pattern attribute accept?', options:['CSS selectors','A regular expression for custom validation','JavaScript code','HTML elements'], correct:1, explanation:'pattern takes a regex: pattern="[0-9]{10}" validates 10-digit numbers.' },
  { id:'h22f', type:'mc', question:'What does min="18" max="120" do on a number input?', options:['Sets font size range','Limits the number range','Sets width','Creates a slider'], correct:1, explanation:'min and max constrain the allowed number range.' },
  { id:'h22g', type:'mc', question:'HTML validation happens:', options:['Only with JavaScript','Before JavaScript — it is the first line of defense','After the page loads','Only on the server'], correct:1, explanation:'Built-in HTML validation runs before any JavaScript, providing free validation.' },
]},

{ lessonId:'h13-1', questions:[
  { id:'h23a', type:'mc', question:'What does alt="" (empty alt) mean?', options:['Alt is missing','The image is decorative — screen readers skip it','An error','The image has no source'], correct:1, explanation:'Empty alt tells screen readers the image is decorative.' },
  { id:'h23b', type:'mc', question:'Why is heading order important for accessibility?', options:['Visual hierarchy','Screen reader users navigate by heading level','SEO only','It isn\'t important'], correct:1, explanation:'Screen readers let users jump between heading levels to find content.' },
  { id:'h23c', type:'mc', question:'What does removing focus outlines break?', options:['Nothing','Keyboard users can\'t see where they are on the page','Colors change','Links break'], correct:1, explanation:'Focus outlines show keyboard users which element is currently focused.' },
  { id:'h23d', type:'mc', question:'What does "a11y" stand for?', options:['A CSS framework','Accessibility (a + 11 letters + y)','A testing tool','An HTML element'], correct:1, explanation:'a11y is a numeronym: a-ccessibilit-y = a + 11 characters + y.' },
  { id:'h23e', type:'mc', question:'Every form input needs a:', options:['Placeholder','Connected <label>','Title attribute','Tooltip'], correct:1, explanation:'Labels are required for screen readers to identify form fields.' },
  { id:'h23f', type:'mc', question:'What does semantic HTML do for accessibility?', options:['Nothing','Provides meaning that assistive technology can understand','Adds ARIA automatically','Speeds up screen readers'], correct:1, explanation:'Screen readers understand <nav>, <main>, <article> but not <div>.' },
  { id:'h23g', type:'mc', question:'The Tab key is used by keyboard users to:', options:['Indent code','Navigate between interactive elements','Close the page','Type a tab character'], correct:1, explanation:'Tab moves focus between links, buttons, and form inputs.' },
]},

{ lessonId:'h13-2', questions:[
  { id:'h24a', type:'mc', question:'What does aria-label provide?', options:['A visible label','An accessible name when no visible text exists','A tooltip','CSS styling'], correct:1, explanation:'aria-label gives screen readers a text label for unlabeled elements.' },
  { id:'h24b', type:'mc', question:'What does aria-hidden="true" do?', options:['Hides visually','Hides from screen readers only','Deletes the element','Disables it'], correct:1, explanation:'aria-hidden removes the element from the accessibility tree.' },
  { id:'h24c', type:'mc', question:'What does tabindex="0" do?', options:['Removes from tab order','Adds the element to the keyboard tab order','Makes it the first element','Disables focus'], correct:1, explanation:'tabindex="0" makes non-interactive elements keyboard-focusable.' },
  { id:'h24d', type:'mc', question:'What does tabindex="-1" do?', options:['Adds to tab order','Removes from tab order (but JS can still focus it)','Makes it first','Disables the element'], correct:1, explanation:'tabindex="-1" removes from tab order but allows programmatic focus.' },
  { id:'h24e', type:'mc', question:'When should you use ARIA?', options:['On every element','Only when native HTML cannot convey the meaning','Always on divs','Never'], correct:1, explanation:'Rule: if a native HTML element exists, use it. ARIA is a last resort.' },
  { id:'h24f', type:'mc', question:'What does role="button" do?', options:['Styles it as a button','Tells assistive tech the element behaves as a button','Creates a button','Nothing'], correct:1, explanation:'role tells screen readers what an element does — but use <button> instead.' },
  { id:'h24g', type:'mc', question:'What does aria-live="polite" do?', options:['Makes text blink','Announces dynamic content changes to screen readers','Adds animation','Creates a chat'], correct:1, explanation:'aria-live tells screen readers to announce content updates.' },
]},

{ lessonId:'h14-1', questions:[
  { id:'h25a', type:'mc', question:'What is the ideal <title> length?', options:['10-20 characters','50-60 characters','100+ characters','No limit'], correct:1, explanation:'50-60 characters ensures the full title shows in search results.' },
  { id:'h25b', type:'mc', question:'What do Open Graph tags control?', options:['Page speed','How the page appears when shared on social media','SEO ranking','Font loading'], correct:1, explanation:'OG tags set the title, description, and image for social media previews.' },
  { id:'h25c', type:'mc', question:'OG tags use which attribute instead of name?', options:['value','property','data','content'], correct:1, explanation:'<meta property="og:title"> uses property instead of name.' },
  { id:'h25d', type:'mc', question:'What does <link rel="canonical"> do?', options:['Links CSS','Tells search engines which URL is the "real" version','Opens in canonical mode','Adds a font'], correct:1, explanation:'Canonical URLs prevent duplicate content issues in search rankings.' },
  { id:'h25e', type:'mc', question:'Meta description should be:', options:['500+ characters','150-160 characters','10 characters','Not included'], correct:1, explanation:'150-160 characters ensures the full snippet shows in search results.' },
  { id:'h25f', type:'mc', question:'What does og:image set?', options:['The page background','The image shown in social media link previews','The favicon','The header image'], correct:1, explanation:'og:image controls the preview image on Facebook, LinkedIn, etc.' },
  { id:'h25g', type:'mc', question:'Twitter uses which meta tag type?', options:['og: tags','twitter:card tags','meta name="twitter"','link rel="twitter"'], correct:1, explanation:'Twitter uses its own twitter:card meta tags for link previews.' },
]},


{ lessonId:'h15-1', questions:[
  { id:'h26a', type:'mc', question:'Why is the homepage named index.html?', options:['VS Code requires it','Browsers/servers look for it by default','It loads faster','It is the only valid name'], correct:1, explanation:'Servers serve index.html automatically when no file is specified.' },
  { id:'h26b', type:'mc', question:'Where should CSS files go?', options:['Root folder','A css/ subfolder','Inside <head>','After </html>'], correct:1, explanation:'Organized structure: css/, js/, images/ folders keep projects clean.' },
  { id:'h26c', type:'mc', question:'What is a relative path?', options:['Full URL with https','Path relative to the current file like ./css/styles.css','Absolute path on disk','A URL shortener'], correct:1, explanation:'Relative paths reference files based on the current file\'s location.' },
  { id:'h26d', type:'mc', question:'Why use <script defer> instead of just <script>?', options:['It is faster to download','It loads JS after HTML parsing, preventing blocking','It is required','It adds error handling'], correct:1, explanation:'defer prevents the script from blocking HTML parsing.' },
  { id:'h26e', type:'mc', question:'Where should JS files go in the folder structure?', options:['Root with HTML','A js/ subfolder','In the css/ folder','Inline only'], correct:1, explanation:'js/ folder keeps scripts organized and separated from markup.' },
  { id:'h26f', type:'mc', question:'Which path is correct for an image in an images/ folder?', options:['images.jpg','./images/photo.jpg','/photo','img:photo.jpg'], correct:1, explanation:'./images/photo.jpg navigates from current directory into images folder.' },
  { id:'h26g', type:'mc', question:'What is wrong with 47 files in one folder?', options:['Nothing','Hard to navigate, maintain, and debug','Too many for browsers','Performance issues'], correct:1, explanation:'Organized folders make projects maintainable and professional.' },
]},

{ lessonId:'h16-1', questions:[
  { id:'h27a', type:'mc', question:'Are DevTools edits permanent?', options:['Yes','No — they reset on refresh','Only CSS edits','Only on localhost'], correct:1, explanation:'All DevTools changes are temporary — the original source is unchanged.' },
  { id:'h27b', type:'mc', question:'What does the box model show?', options:['Font metrics','Content + padding + border + margin dimensions','Color values','JavaScript scope'], correct:1, explanation:'The box model diagram shows the four layers around every element.' },
  { id:'h27c', type:'mc', question:'Where do you see CSS applied to an element?', options:['Console tab','Elements tab → Styles panel','Network tab','Sources tab'], correct:1, explanation:'Selecting an element in the Elements tab shows its computed styles.' },
  { id:'h27d', type:'mc', question:'What does the Console tab show?', options:['HTML structure','JavaScript errors and log output','Network requests','Images'], correct:1, explanation:'Console displays errors, warnings, and output from console.log().' },
  { id:'h27e', type:'mc', question:'How do you inspect a specific element?', options:['View Source','Right-click → Inspect','Ctrl+A','Double-click'], correct:1, explanation:'Right-click → Inspect opens DevTools focused on that element.' },
  { id:'h27f', type:'mc', question:'The Network tab shows:', options:['CSS variables','Every file loaded by the page (HTML, CSS, JS, images)','Browser history','Bookmarks'], correct:1, explanation:'Network shows all HTTP requests — useful for debugging missing resources.' },
  { id:'h27g', type:'mc', question:'What is "Computed" in the Styles panel?', options:['The CSS you wrote','The final, resolved styles after all rules are applied','Default browser styles','Inline styles only'], correct:1, explanation:'Computed shows the actual values applied after cascade and specificity.' },
]},

{ lessonId:'h17-1', questions:[
  { id:'h28a', type:'mc', question:'What happens with multiple <h1> tags?', options:['They all render correctly','It confuses SEO and accessibility — use only one h1','The page crashes','Only the first renders'], correct:1, explanation:'One <h1> per page gives clear hierarchy for search engines and screen readers.' },
  { id:'h28b', type:'mc', question:'What is wrong with: <p><div>text</div></p>?', options:['Nothing','Block element (<div>) nested inside inline context (<p>)','Missing class','Needs alt'], correct:1, explanation:'<p> cannot contain block elements. The browser will incorrectly split the <p>.' },
  { id:'h28c', type:'mc', question:'Forgetting alt on images is:', options:['Fine','An accessibility violation','A JavaScript error','A CSS issue'], correct:1, explanation:'Missing alt means screen readers cannot describe the image.' },
  { id:'h28d', type:'mc', question:'Using <div> for everything is called:', options:['Best practice','Div soup — use semantic elements instead','Modern HTML','Acceptable'], correct:1, explanation:'Semantic elements provide meaning that divs cannot.' },
  { id:'h28e', type:'mc', question:'Forgetting a closing tag causes:', options:['A clear error message','The browser guesses where to close it — often wrongly','Nothing','The tag is ignored'], correct:1, explanation:'Browsers auto-close tags, but their guesses often cause layout bugs.' },
  { id:'h28f', type:'mc', question:'What tool catches HTML errors browsers silently fix?', options:['CSS Validator','W3C HTML Validator','JavaScript Console','Lighthouse'], correct:1, explanation:'The W3C Validator catches errors that browsers silently tolerate.' },
  { id:'h28g', type:'mc', question:'Using headings just for font size is:', options:['Correct','Wrong — headings define structure, use CSS for size','Sometimes okay','Required for SEO'], correct:1, explanation:'Heading levels define document hierarchy, not visual size.' },
]},

{ lessonId:'h18-1', questions:[
  { id:'h29a', type:'mc', question:'What does the W3C Validator check?', options:['JavaScript errors','HTML standards compliance and errors','CSS specificity','Page speed'], correct:1, explanation:'The W3C Validator checks HTML against official web standards.' },
  { id:'h29b', type:'mc', question:'What is consistent indentation for?', options:['Performance','Readability — makes code easier to debug and maintain','The browser requires it','Accessibility'], correct:1, explanation:'Indentation shows nesting structure at a glance.' },
  { id:'h29c', type:'mc', question:'Which is a better class name?', options:['.ct','style1','.card-title','.x1'], correct:2, explanation:'Descriptive names like .card-title are self-documenting.' },
  { id:'h29d', type:'mc', question:'Should you leave commented-out code in production?', options:['Yes for reference','No — it is clutter. Delete unused code.','Always','Sometimes'], correct:1, explanation:'Commented-out code adds noise. Use version control instead.' },
  { id:'h29e', type:'mc', question:'Tag names should be:', options:['UPPERCASE','lowercase','camelCase','Any case'], correct:1, explanation:'HTML convention: always lowercase for tag names and attributes.' },
  { id:'h29f', type:'mc', question:'What is Format on Save?', options:['Saves in a different format','VS Code auto-formats code when you save','Compresses files','Minifies HTML'], correct:1, explanation:'Format on Save auto-applies consistent indentation and spacing.' },
  { id:'h29g', type:'mc', question:'How many validation errors is acceptable for production?', options:['Under 10','Zero','Under 50','Doesn\'t matter'], correct:1, explanation:'Zero errors. Validate everything before deploying.' },
]},

{ lessonId:'h19-1', questions:[
  { id:'h30a', type:'mc', question:'How do you access data-item-id="42" in JS?', options:['element.data.itemId','element.dataset.itemId','element.getAttribute("item-id")','element.dataItemId'], correct:1, explanation:'data-* attributes use dataset with camelCase: data-item-id → dataset.itemId.' },
  { id:'h30b', type:'mc', question:'What prefix do custom data attributes use?', options:['attr-','custom-','data-','x-'], correct:2, explanation:'All custom data attributes start with data- by convention and spec.' },
  { id:'h30c', type:'mc', question:'What type are all dataset values?', options:['Numbers','Strings','Booleans','Objects'], correct:1, explanation:'dataset values are always strings — you must parse numbers yourself.' },
  { id:'h30d', type:'mc', question:'data-my-value becomes which dataset property?', options:['data.myValue','dataset.myValue','dataset.my-value','dataset.MyValue'], correct:1, explanation:'Hyphens convert to camelCase: data-my-value → dataset.myValue.' },
  { id:'h30e', type:'mc', question:'Why use data attributes instead of class names for data?', options:['Performance','data-* is designed for storing data; classes are for styling','No difference','Classes are limited'], correct:1, explanation:'data-* attributes are semantic. Using classes like .price-29 is a hack.' },
  { id:'h30f', type:'mc', question:'Can you put any value in a data attribute?', options:['Only numbers','Only strings (but any string is valid)','Only booleans','Only JSON'], correct:1, explanation:'Values are always strings. Store JSON by stringifying objects.' },
  { id:'h30g', type:'mc', question:'How many data attributes can one element have?', options:['One','Three maximum','Unlimited','Five'], correct:2, explanation:'No limit — add as many data-* attributes as needed.' },
]},

{ lessonId:'h19-2', questions:[
  { id:'h31a', type:'mc', question:'Does <template> content render on the page?', options:['Yes immediately','No — it is invisible until JavaScript clones it','Only with CSS','Only in Chrome'], correct:1, explanation:'Template content exists in the document but is not rendered.' },
  { id:'h31b', type:'mc', question:'How do you use a template?', options:['It auto-renders','Clone it with JS: template.content.cloneNode(true)','Link it with href','Import it'], correct:1, explanation:'JavaScript clones the template content and appends it to the DOM.' },
  { id:'h31c', type:'mc', question:'What is the DOM?', options:['A CSS framework','The browser\'s live tree of all HTML elements','A JavaScript library','A server'], correct:1, explanation:'The DOM is the browser\'s in-memory representation of the HTML.' },
  { id:'h31d', type:'mc', question:'Why is understanding the DOM important?', options:['It isn\'t','JavaScript uses the DOM to add, remove, and change elements','For CSS only','For SEO'], correct:1, explanation:'All JavaScript DOM manipulation targets the live DOM tree.' },
  { id:'h31e', type:'mc', question:'Templates vs innerHTML for dynamic content:', options:['innerHTML is better','Templates are cleaner and more secure','No difference','Templates are slower'], correct:1, explanation:'Templates avoid XSS risks and keep HTML structure visible in the source.' },
  { id:'h31f', type:'mc', question:'Can templates contain scripts?', options:['No','Yes, but they don\'t execute until cloned into the DOM','Only inline scripts','Only external scripts'], correct:1, explanation:'Script inside <template> won\'t run until the content is cloned and inserted.' },
  { id:'h31g', type:'mc', question:'The DOM tree structure mirrors:', options:['The CSS file','The nesting of HTML elements','The JavaScript file','The file system'], correct:1, explanation:'Each nested HTML element becomes a child node in the DOM tree.' },
]},

{ lessonId:'h20-1', questions:[
  { id:'h32a', type:'mc', question:'IDs and classes serve as __ for JavaScript.', options:['Decorations','Hooks — JS uses them to find elements','Validators','Servers'], correct:1, explanation:'querySelector uses IDs and classes to locate elements in the DOM.' },
  { id:'h32b', type:'mc', question:'What does document.getElementById() return?', options:['An array','A single element (or null)','All matching elements','A string'], correct:1, explanation:'getElementById returns one element — IDs must be unique.' },
  { id:'h32c', type:'mc', question:'What does querySelectorAll() return?', options:['One element','A NodeList of all matching elements','A string','An error'], correct:1, explanation:'querySelectorAll returns all elements matching the CSS selector.' },
  { id:'h32d', type:'mc', question:'Why use descriptive IDs like "search-input"?', options:['Performance','Readable code — you know what it refers to weeks later','Required by HTML','Style preference'], correct:1, explanation:'id="div1" is meaningless. id="search-input" is self-documenting.' },
  { id:'h32e', type:'mc', question:'Forms interact with JS through:', options:['CSS only','Submit events, input values, and validation','The DOM only','Cookies'], correct:1, explanation:'JavaScript handles form events, reads values, and adds custom validation.' },
  { id:'h32f', type:'mc', question:'What does addEventListener attach to?', options:['CSS rules','HTML elements (DOM nodes)','The URL','The server'], correct:1, explanation:'Event listeners attach to DOM elements to respond to user actions.' },
  { id:'h32g', type:'mc', question:'Good HTML makes JavaScript:', options:['Unnecessary','Easier — clean structure = simple selectors','Slower','More complex'], correct:1, explanation:'Well-structured HTML with clear IDs/classes simplifies JavaScript targeting.' },
]},

{ lessonId:'h20-2', questions:[
  { id:'h33a', type:'mc', question:'A complete site needs at minimum:', options:['Just index.html','index.html, CSS, proper structure, semantic HTML','10+ pages','A database'], correct:1, explanation:'A real site needs proper skeleton, semantic layout, CSS, and organized files.' },
  { id:'h33b', type:'mc', question:'Navigation should work:', options:['On the homepage only','Across ALL pages with consistent links','Only on desktop','Without links'], correct:1, explanation:'Consistent navigation on every page is fundamental web design.' },
  { id:'h33c', type:'mc', question:'Before deploying, you should:', options:['Nothing','Validate with W3C, check accessibility, test links','Only check on Chrome','Compress all images'], correct:1, explanation:'Validation, accessibility, and link testing are pre-deployment essentials.' },
  { id:'h33d', type:'mc', question:'In an interview, what matters most about your code?', options:['That it works','That you can explain every decision you made','That it uses frameworks','That it\'s short'], correct:1, explanation:'Being able to explain WHY you chose each element and approach is key.' },
  { id:'h33e', type:'mc', question:'Relative links between pages look like:', options:['https://mysite.com/about','about.html or ./about.html','#about','@about'], correct:1, explanation:'Within a project, relative paths reference other files directly.' },
  { id:'h33f', type:'mc', question:'Every page in a multi-page site needs:', options:['Different CSS','Its own HTML skeleton, head, and body','The same title','No navigation'], correct:1, explanation:'Each page is a complete HTML document with its own skeleton.' },
  { id:'h33g', type:'mc', question:'What makes HTML "mastered"?', options:['Memorizing every tag','Building semantic, accessible, validated sites and explaining your decisions','Using all 100+ tags','Passing a test'], correct:1, explanation:'Mastery = building real things with proper structure and knowing why.' },
]},


// ═══════════════════════════════════════════════
];
