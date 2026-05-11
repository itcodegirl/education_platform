export const SEARCH_INDEX_MANIFEST = Object.freeze(
[
  {
    "title": "Make Your Name Appear in a Browser",
    "module": "Get Something Working",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 01 make your name appear in a browser beginner 15 min 15 beginner 3 3 create your first html file make text appear in a web browser see your name displayed as a big heading create your first web page open vs code or download it free from code.visualstudio.com if you don t have it click file → new file click file → save as name it exactly my first page.html save it to your desktop so you can find it easily doctype html html head title my first web page title head body h1 hello i m your name h1 p i just created my first web page p body html you just created a working web page with html your web page in the browser with your name displayed html hypertext markup language this is the language that creates web pages. every website you ve ever visited uses html. the skeleton of a house. html provides the structure the walls floors and rooms. later you ll add paint css and electricity javascript . tags the building blocks tags are words inside angle brackets like h1 and h1 . they work in pairs opening tag h1 closing tag h1 and content between them. bookends. the opening tag and closing tag hold the content between them. the basic structure every html page has the same skeleton docty",
    "courseIdx": 0,
    "modIdx": 0,
    "lesIdx": 0
  },
  {
    "title": "Connect Pages with Links",
    "module": "Get Something Working",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 02 connect pages with links lesson 01 beginner 18 min 18 beginner 4 4 make text clickable so it goes to another page create a second html page connect your pages together with links build a simple two page website add a link to another website open your my first page.html file in vs code find one of your p paragraphs add this new paragraph at the end of your body right before body save the file refresh your browser and click the link p want to learn more about coding visit a href https www.freecodecamp.org freecodecamp a for free tutorials. p you ll see blue underlined text that you can click. when clicked it opens freecodecamp in the same browser tab. your web page with the clickable link the link should be blue and underlined the a tag anchor tag this creates clickable links the foundation of the world wide web. a stands for anchor because links anchor different pages together. a portal door. it takes you from one place to another when you step through it click it . the href attribute href is an attribute extra information you add inside an opening tag. it tells the link where to go. an address on an envelope. the a tag is the envelope the href is where it s going and the ",
    "courseIdx": 0,
    "modIdx": 0,
    "lesIdx": 1
  },
  {
    "title": "Add Images to Your Pages",
    "module": "Get Something Working",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 03 add images to your pages lesson 02 beginner 20 min 20 beginner 5 4 display an image on your web page control the size of images add descriptive text for accessibility make images clickable links add your first image find a photo you want to use or use this practice image https images.unsplash.com photo 1571171637578 41bc2dd41cd2 w 400 open your index.html or my first page.html in vs code add the code below somewhere in your body save and refresh your browser img src https images.unsplash.com photo 1571171637578 41bc2dd41cd2 w 400 alt a laptop on a desk with code on the screen you ll see an image appear on your page your web page with the image visible the img tag this displays images on your web page. it s a self closing tag no closing img needed. it just says put an image here. a picture frame that goes on the wall. you don t open and close a picture frame you just hang it up. the src attribute source tells the browser where to find the image. can be a url https ... or a filename my photo.jpg if the image is in the same folder. like an address telling the delivery person where to pick up a package. the alt attribute alternative text describes what the image shows. used b",
    "courseIdx": 0,
    "modIdx": 0,
    "lesIdx": 2
  },
  {
    "title": "Format Text Like a Pro",
    "module": "Get Something Working",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 08 format text like a pro lesson 03 beginner 20 min 20 beginner 8 4 make text bold italic and highlighted add line breaks and dividers use special characters that don t exist on your keyboard understand when to use div vs span format quotes and code snippets make text bold and italic create a new file formatting.html copy the code below save and open in your browser look at how each tag changes the appearance doctype html html lang en head meta charset utf 8 title text formatting practice title head body h1 learning text formatting h1 p this is normal text. p p this is strong really important text strong that needs emphasis. p p this is em emphasized text em that s slightly important. p p you can also strong em combine them em strong for extra emphasis p p here s something mark highlighted mark like with a yellow marker. p p this is normal text but small this part is smaller small . p body html you ll see text that s bold italic highlighted in yellow and different sizes all the different text formatting styles strong vs b strong means this is important semantic . b just makes it look bold visual only . always use strong for important content. the difference between yelling f",
    "courseIdx": 0,
    "modIdx": 0,
    "lesIdx": 3
  },
  {
    "title": "Decode the Secret Language Browsers Speak",
    "module": "Understand What You Built",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 10 decode the secret language browsers speak lesson 08 beginner 15 min 15 beginner 3 3 build a webpage that shows html vs css vs javascript see exactly what each language does by turning them on and off create a visual demonstration you can show to anyone build a three language demo page open vs code create a new file called three languages.html copy and paste the code below save the file open it in your browser click the button doctype html html head title html vs css vs javascript title style this is css it controls appearance h1 color blue font size 40px p background color yellow padding 10px style head body h1 this heading is big and blue h1 p this paragraph has a yellow background p button onclick alert this is javascript click me button body html you just saw html structure css style and javascript behavior working together screenshot showing the blue heading yellow paragraph and the popup after clicking the button. html hypertext markup language this is the content and structure. the h1 p and button tags you wrote are html. they create the things on the page. html is not a programming language — it doesn t calculate make decisions or respond to events. it just describ",
    "courseIdx": 0,
    "modIdx": 1,
    "lesIdx": 0
  },
  {
    "title": "Watch a Browser Build Your Page Step-by-Step",
    "module": "Understand What You Built",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 11 watch a browser build your page step by step lesson 10 beginner 18 min 18 beginner 4 4 create a page that shows html loading one piece at a time see exactly how browsers read from top to bottom build a visual construction sequence animation build a slow loading page open vs code create a new file called browser reads html.html copy and paste the code below save the file open it in your browser watch the boxes appear one by one from top to bottom doctype html html head title browser loading demo title style .box background lightblue padding 20px margin 10px opacity 0 animation fadein 1s forwards @keyframes fadein to opacity 1 .box nth child 1 animation delay 0s .box nth child 2 animation delay 1s .box nth child 3 animation delay 2s .box nth child 4 animation delay 3s style head body div class box 📦 box 1 i load first top of html div div class box 📦 box 2 i load second div div class box 📦 box 3 i load third div div class box 📦 box 4 i load last bottom of html div body html you just watched a browser read your html from top to bottom exactly how it happens in real life but slowed down so you can see it screenshot showing all four boxes after they have all appeared. top t",
    "courseIdx": 0,
    "modIdx": 1,
    "lesIdx": 1
  },
  {
    "title": "Organize Information with Lists",
    "module": "Add More Features",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 04 organize information with lists lesson 03 beginner 16 min 16 beginner 3 4 create bullet point lists for your hobbies make numbered step by step instructions build a navigation menu with lists nest lists inside other lists make a bullet point list open any html file try index.html add this code in your body replace these reasons with your actual reasons save and refresh h2 why i m learning to code h2 ul li i want to build my own projects li li i m tired of paying for simple websites li li i want a career change li li i love solving puzzles li ul you ll see bullet points • next to each reason your bulleted list with your reasons the ul tag unordered list creates bullet point lists. unordered means the sequence doesn t matter — you could rearrange items and the meaning stays the same. a grocery list. order doesn t matter — you could buy milk before eggs or eggs before milk. the ol tag ordered list creates numbered lists. ordered means sequence matters — step 1 must come before step 2. a recipe. you can t frost a cake before baking it — order matters the li tag list item each li represents one item in the list. works inside both ul and ol . individual items on your shopping l",
    "courseIdx": 0,
    "modIdx": 2,
    "lesIdx": 0
  },
  {
    "title": "Display Data in Tables",
    "module": "Add More Features",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 06 display data in tables lesson 04 beginner 18 min 18 beginner 4 4 create a table with rows and columns add headers that describe your data display structured information clearly build a pricing comparison table make your first table create a new file schedule.html copy the code below save and open in your browser doctype html html head title my weekly schedule title head body h1 my learning schedule h1 table border 1 tr td monday td td html practice td td 1 hour td tr tr td tuesday td td build project td td 2 hours td tr tr td wednesday td td watch tutorials td td 1 hour td tr table body html you ll see a grid with 3 rows and 3 columns with borders around each cell your table with borders and data the table tag creates the container for your entire table. everything else goes inside it. the frame of a spreadsheet or excel grid. the tr tag table row each tr is one row going across the table horizontally. tables are built row by row. like horizontal lines on notebook paper each line is a row. the td tag table data each td is one cell in the row. td stands for table data it s where your actual content goes. individual boxes in the grid where you write information. the th tag ",
    "courseIdx": 0,
    "modIdx": 2,
    "lesIdx": 1
  },
  {
    "title": "Collect Information with Forms",
    "module": "Add More Features",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 05 collect information with forms lesson 06 beginner 25 min 25 beginner 6 5 create a text input where users can type add a submit button build dropdown menus with multiple choices make checkboxes and radio buttons build a complete contact form create your first text input create a new file contact.html copy the code below save and open in your browser click in the input box and type your name doctype html html head title contact me title head body h1 get in touch h1 form label for name your name label input type text id name name name form body html you ll see a text box where you can type the label your name sits next to it. the input box with text typed inside it the form tag a container for all input elements. think of it as a clipboard that holds all the fields you want someone to fill out. a clipboard with a form. the form tag is the clipboard labels are printed questions inputs are blank lines to write on. the label tag text that describes what the input is for. it s clickable — when you click the label it focuses the input the question on a form that tells you what to write in each blank. the input tag creates an input field. it s self closing no input needed . the ty",
    "courseIdx": 0,
    "modIdx": 2,
    "lesIdx": 2
  },
  {
    "title": "Add Media to Your Pages",
    "module": "Add More Features",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 09 add media to your pages lesson 05 beginner 22 min 22 beginner 4 4 embed a video that plays in the browser add audio files that users can play embed youtube videos on your site add google maps with iframes understand when to use each media type add a video to your page create a new file media.html copy the code below save and open in your browser click the play button doctype html html lang en head meta charset utf 8 title media practice title head body h1 my media gallery h1 h2 sample video h2 video width 400 controls source src https www.w3schools.com html mov_bbb.mp4 type video mp4 your browser doesn t support video playback. video p try clicking play you can pause adjust volume and go fullscreen. p body html you ll see a video player with play pause controls a timeline and volume controls the video player paused or playing the video tag embeds a video file that plays directly in the browser no youtube no external player needed . the controls attribute shows play pause buttons. like a dvd player built into your webpage plays video right there without opening another app. the audio tag works exactly like video but for sound only. shows a smaller audio player with play pa",
    "courseIdx": 0,
    "modIdx": 2,
    "lesIdx": 3
  },
  {
    "title": "Build Pages Like a Professional (Semantic HTML)",
    "module": "Build Like a Pro",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 07 build pages like a professional semantic html lesson 09 intermediate 22 min 22 intermediate 7 3 transform a basic page into a professionally structured page use header nav main footer like real developers understand why structure matters for accessibility make your code readable and seo friendly transform divs with semantic tags create blog.html copy the transformed code below save and open in browser notice it looks the same but the code has meaning now doctype html html lang en head meta charset utf 8 meta name viewport content width device width initial scale 1.0 title my blog title head body header h1 sarah s coding journey h1 p learning one step at a time p header nav ul li a href index.html home a li li a href about.html about a li li a href blog.html blog a li ul nav main article h2 my first week of html h2 p i thought i d never understand tags... p article main footer p copy 2024 sarah martinez built with html p footer body html now the code has semantic meaning. screen readers can understand your structure your code showing the semantic tags header nav main footer header tag top of page or section. contains site title logo tagline or article metadata title author",
    "courseIdx": 0,
    "modIdx": 3,
    "lesIdx": 0
  },
  {
    "title": "Build a Real Portfolio Website You Can Share",
    "module": "Build Like a Pro",
    "course": "HTML",
    "icon": "🧱",
    "keywords": "lesson 12 build a real portfolio website you can share lesson 07 intermediate 45 min 45 intermediate 11 5 create a multi page portfolio website with everything you ve learned link pages together with navigation add images lists forms and formatted text deploy it live on the internet free set up your project and build the home page create a new folder on your desktop called my portfolio inside that folder create these files index.html about.html projects.html contact.html create a subfolder called images inside my portfolio copy the starter code below into index.html replace your name with your actual name save and open index.html in your browser doctype html html head title your name web developer title style body font family arial sans serif max width 800px margin 0 auto padding 20px background color f5f5f5 nav background color 333 padding 15px margin bottom 30px nav a color white text decoration none margin right 20px font weight bold nav a hover color 4caf50 h1 color 333 border bottom 3px solid 4caf50 padding bottom 10px style head body nav a href index.html home a a href about.html about a a href projects.html projects a a href contact.html contact a nav h1 welcome i m your nam",
    "courseIdx": 0,
    "modIdx": 3,
    "lesIdx": 1
  },
  {
    "title": "Paint Your First Webpage",
    "module": "CSS Foundations",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 1 1 paint your first webpage beginner 15 min 15 beginner 3 3 change the background color of a webpage make text turn red create a colorful heading make your webpage turn blue open vs code or use codepen.io if you don t have vs code installed yet create a new file and save it as colors.html copy and paste the code below save the file double click the file to open it in your browser your whole page should have a light blue background doctype html html head title my colorful page title style body background color lightblue style head body h1 look a blue background h1 p this is my first styled webpage. p body html you just used css to change the background color of your entire webpage screenshot showing your light blue webpage. the style tag this is where css code lives inside an html file. everything between style and style is css not html. a painter s instructions before they start painting. the style tag says here s how i want things to look. the body selector this tells css i want to style the body element. the body is the entire visible part of your webpage — everything you can see. pointing at a room and saying paint this room blue. the selector picks what to paint. the backg",
    "courseIdx": 1,
    "modIdx": 0,
    "lesIdx": 0
  },
  {
    "title": "Control Text Size and Weight",
    "module": "CSS Foundations",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 1 2 control text size and weight css 1 1 beginner 18 min 18 beginner 4 3 make a heading huge make text bold without using b tags change the font to something that doesn t look like times new roman make a giant headline create a new file and save it as text styling.html copy and paste the code below save and open in your browser your heading should be massive compared to the paragraph doctype html html head title text styling title style h1 font size 72px style head body h1 i m huge h1 p this is regular text for comparison. p body html you just used the font size property to make text way bigger than default screenshot showing the size difference between your heading and paragraph. the font size property controls how big or small your text appears. you can use px pixels for exact size em for relative to parent or rem for relative to root. setting the font size on a word document except you have way more control. pixels px the most common unit for beginners. 16px is default browser text. 72px is huge heading text. 12px is tiny fine print. like measuring in inches — exact predictable easy to understand. font weight controls how thick or thin text appears. values normal default bol",
    "courseIdx": 1,
    "modIdx": 0,
    "lesIdx": 1
  },
  {
    "title": "Add Space Around Things",
    "module": "CSS Foundations",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 1 3 add space around things css 1 2 beginner 20 min 20 beginner 4 3 push elements away from each other with margins add breathing room inside boxes with padding understand the difference between margin and padding stop everything from touching the edges create a new file and save it as spacing.html copy and paste the code below save and open in your browser see how the content is pushed away from the window edges doctype html html head title spacing title style body margin 40px background color lightgray h1 background color lightblue style head body h1 this heading has space around it now h1 p notice how everything is pushed away from the edges p body html you added margin to the body which creates space between the edge of the browser window and your content screenshot showing the gray space around your content. margin space outside an element. it pushes other elements away. the background color does not fill the margin area. the personal space bubble around a person. margin is the don t come closer than this zone. padding space inside an element between the border and the content. the background color does fill the padding area. the cushioning inside a picture frame. the padd",
    "courseIdx": 1,
    "modIdx": 0,
    "lesIdx": 2
  },
  {
    "title": "Draw Borders and Understand the Box Model",
    "module": "CSS Foundations",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 1 4 draw borders and understand the box model css 1 3 beginner 18 min 18 beginner 4 3 add borders around elements control border thickness style and color understand how margin border padding and content work together add a border to a box create a new file and save it as borders.html copy and paste the code below save and open in browser you should see a light blue box with a black border around it doctype html html head title borders title style .box background color lightblue padding 20px border 3px solid black style head body div class box this box has a border div body html you added a solid black border that s 3 pixels thick screenshot showing your bordered box. the border property shorthand three properties in one border width 3px border style solid and border color black . you can write them together or separately. drawing a picture frame around your content. you specify how thick what style and what color. border styles solid continuous line most common . dashed broken line. dotted dots. double two lines. none no border. different types of picture frames — wood rope dotted line double frame. the box model every element is a box with four layers 1 content text images 2 ",
    "courseIdx": 1,
    "modIdx": 0,
    "lesIdx": 3
  },
  {
    "title": "Center Everything",
    "module": "CSS Foundations",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 1 5 center everything css 1 4 beginner 20 min 20 beginner 4 3 center text inside an element center a block element on the page center things vertically the tricky one center text inside a box create a new file and save it as centering.html copy and paste the code below save and open in browser all text should be centered inside the blue box doctype html html head title centering title style .centered text background color lightblue padding 40px text align center style head body div class centered text h1 this text is centered h1 p everything inside this box is centered too. p div body html the text align center property centered all the text inside the div screenshot showing centered text. the text align property controls horizontal alignment of text and inline elements left default center right justify. only affects content inside the element not the element itself. the alignment buttons in microsoft word. but this is for text and inline content only. centering a block with margin 0 auto to center a block element itself give it a max width and set margin 0 auto. auto margins on left right push the box to center. putting equal sized bookends on both sides of books on a shelf — ",
    "courseIdx": 1,
    "modIdx": 0,
    "lesIdx": 4
  },
  {
    "title": "Add Background Images",
    "module": "CSS Foundations",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 1 6 add background images css 1 5 beginner 18 min 18 beginner 3 2 add a background image to any element control image size position and repeat create a parallax scrolling effect build a professional hero section with image overlay add your first background image create a new file and save it as background images.html copy and paste the code below save and open in browser you should see a full width hero with a background image doctype html html head title background images title style body margin 0 font family arial sans serif .hero background image url https images.unsplash.com photo 1557683316 973673baf926 background size cover background position center height 500px display flex justify content center align items center color white .hero content background color rgba 0 0 0 0.5 padding 40px border radius 12px text align center .hero h1 font size 48px margin 0 style head body div class hero div class hero content h1 welcome to my website h1 div div body html background image fills the hero section with background size cover screenshot showing your hero section with background image. background image and background size background image url sets the image. background size cover",
    "courseIdx": 1,
    "modIdx": 0,
    "lesIdx": 5
  },
  {
    "title": "Line Things Up with Flexbox",
    "module": "Layout Mastery",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 2 1 line things up with flexbox css 1 6 beginner 18 min 18 beginner 3 2 make boxes sit side by side instead of stacking control direction horizontal or vertical add gaps between items build a three column layout make boxes sit side by side create a new file and save it as flexbox intro.html copy and paste the code below save and open in browser boxes sit side by side instead of stacking doctype html html head title flexbox magic title style .container display flex background color f0f0f0 padding 20px gap 20px .box background color 667eea color white padding 40px border radius 8px font size 20px font weight bold style head body h1 flexbox demo h1 div class container div class box box 1 div div class box box 2 div div class box box 3 div div body html display flex made boxes sit side by side instead of stacking screenshot showing three boxes in a row. display flex turns a container into a flex container. all direct children become flex items and line up in a row by default. a shelf that automatically arranges books horizontally. flex direction row default horizontal. column vertical. row reverse and column reverse flip the order. choosing whether to stack books horizontally on a ",
    "courseIdx": 1,
    "modIdx": 1,
    "lesIdx": 0
  },
  {
    "title": "Space Things Out with Justify and Align",
    "module": "Layout Mastery",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 2 2 space things out with justify and align css 2 1 beginner 20 min 20 beginner 2 2 push items to opposite sides of a container center everything perfectly distribute space evenly between items vertically center content space items apart create a new file and save it as justify align.html copy and paste the code below save and open in browser see how each justify content value arranges items differently doctype html html head title justify content title style .flex container display flex background color f5f5f5 padding 20px margin bottom 20px .item background color 4ecdc4 padding 20px 30px color white font weight bold border radius 8px style head body h2 space between h2 div class flex container style justify content space between div class item item 1 div div class item item 2 div div class item item 3 div div h2 center h2 div class flex container style justify content center gap 20px div class item item 1 div div class item item 2 div div class item item 3 div div h2 space evenly h2 div class flex container style justify content space evenly div class item item 1 div div class item item 2 div div class item item 3 div div body html each justify content value distributes items",
    "courseIdx": 1,
    "modIdx": 1,
    "lesIdx": 1
  },
  {
    "title": "Create Grids That Actually Work",
    "module": "Layout Mastery",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 2 3 create grids that actually work css 2 2 intermediate 22 min 22 intermediate 3 2 create a grid layout with rows and columns make items span multiple columns or rows build responsive grids with auto fit create a dashboard layout create a simple grid create a new file and save it as css grid.html copy and paste the code below save and open in browser items automatically arranged into 3 equal columns doctype html html head title css grid title style .grid container display grid grid template columns 1fr 1fr 1fr gap 20px padding 20px background color f5f5f5 .grid item background color ff6b6b color white padding 40px text align center font size 20px font weight bold border radius 8px style head body h1 css grid demo h1 div class grid container div class grid item 1 div div class grid item 2 div div class grid item 3 div div class grid item 4 div div class grid item 5 div div class grid item 6 div div body html items automatically arranged into 3 equal columns screenshot showing your 3 column grid. display grid and grid template columns display grid activates grid. grid template columns defines column widths. 1fr 1 fraction of available space. repeat 3 1fr three equal columns. dra",
    "courseIdx": 1,
    "modIdx": 1,
    "lesIdx": 2
  },
  {
    "title": "Position Things Exactly Where You Want",
    "module": "Layout Mastery",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 2 4 position things exactly where you want css 2 3 intermediate 20 min 20 intermediate 3 2 create a sticky header that follows you build a modal overlay position elements on top of each other understand z index stacking create a sticky header create a new file and save it as positioning.html copy and paste the code below save and open in browser scroll down — the nav sticks to the top doctype html html head title positioning title style body margin 0 font family arial sans serif .sticky nav position sticky top 0 background color 333 color white padding 20px z index 100 .content padding 40px min height 2000px style head body nav class sticky nav h1 sticky navigation h1 nav div class content h2 scroll down... h2 p the navigation stays at the top p div body html the navigation sticks to the top as you scroll screenshot showing the sticky nav at the top after scrolling. position values static default normal flow relative offset from normal absolute relative to positioned parent fixed relative to viewport sticky sticks when scrolling . static sitting in your assigned seat. relative leaning in your chair. absolute floating above the room. fixed bolted to the wall. sticky a magnet on ",
    "courseIdx": 1,
    "modIdx": 1,
    "lesIdx": 3
  },
  {
    "title": "Understanding Display Properties",
    "module": "Layout Mastery",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 2 5 understanding display properties css 2 4 beginner 16 min 16 beginner 3 3 see the difference between block inline and inline block fix common layout quirks make images and text flow correctly see display types in action create a new file and save it as display types.html copy and paste the code below save and open in browser see how each display type behaves differently doctype html html head title display types title style body margin 0 padding 40px font family arial sans serif background color f5f5f5 .demo section background color white padding 20px margin 20px 0 border radius 8px .block item display block background color lightblue padding 15px margin 10px 0 border 2px solid blue .inline item display inline background color lightcoral padding 15px margin 10px border 2px solid red .inline block item display inline block background color lightgreen padding 15px margin 10px border 2px solid green style head body h1 display property examples h1 div class demo section h2 block elements h2 div class block item block 1 div div class block item block 2 div div class block item block 3 div div div class demo section h2 inline elements h2 span class inline item inline 1 span span c",
    "courseIdx": 1,
    "modIdx": 1,
    "lesIdx": 4
  },
  {
    "title": "Build a Complete Navigation Bar",
    "module": "Layout Mastery",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 2 6 build a complete navigation bar css 2 5 intermediate 25 min 25 intermediate 5 2 build a real navigation bar from scratch make it sticky when scrolling add a dropdown menu make it responsive for mobile build the desktop navigation create a new file and save it as complete nav.html copy and paste the code below save and open in browser hover over services to see the dropdown scroll down — the nav sticks to the top doctype html html head meta name viewport content width device width initial scale 1.0 title professional navigation title style margin 0 padding 0 box sizing border box body font family arial sans serif .navbar background color 333 padding 0 40px display flex justify content space between align items center position sticky top 0 z index 1000 box shadow 0 2px 10px rgba 0 0 0 0.1 .logo color white font size 24px font weight bold padding 20px 0 .nav links display flex list style none gap 0 .nav links li position relative .nav links a color white text decoration none padding 25px 20px display inline block transition background color 0.3s ease .nav links a hover background color 555 .dropdown content display none position absolute top 100% left 0 background color white ",
    "courseIdx": 1,
    "modIdx": 1,
    "lesIdx": 5
  },
  {
    "title": "Make It Work on Phones",
    "module": "Responsive Design",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 3 1 make it work on phones css 2 6 beginner 18 min 18 beginner 2 2 write your first media query make boxes stack on mobile understand breakpoints create a responsive navigation your first media query create a new file and save it as media queries.html copy and paste the code below save and open in browser resize your browser — boxes stack on narrow screens doctype html html head meta name viewport content width device width initial scale 1.0 title media queries title style .container display flex gap 20px padding 20px .box flex 1 background color 667eea color white padding 40px text align center border radius 8px @media max width 768px .container flex direction column style head body div class container div class box box 1 div div class box box 2 div div class box box 3 div div body html boxes sit side by side on desktop and stack vertically on mobile screenshots at desktop and mobile widths. media queries @media max width 768px applies css only when screen is 768px or narrower. common breakpoints 768px mobile 1024px tablet 1200px desktop . a thermostat for your layout — when the temperature screen width drops below a threshold the heating different styles kicks in. the viewpor",
    "courseIdx": 1,
    "modIdx": 2,
    "lesIdx": 0
  },
  {
    "title": "Mobile-First Design",
    "module": "Responsive Design",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 3 2 mobile first design css 3 1 beginner 18 min 18 beginner 2 2 build layouts that start mobile and scale up use min width instead of max width understand why mobile first is better create a responsive product grid build mobile first create a new file and save it as mobile first.html copy and paste the code below save and open in browser start narrow then widen — columns appear as space allows doctype html html head meta name viewport content width device width initial scale 1.0 title mobile first title style mobile first single column .grid display grid grid template columns 1fr gap 20px padding 20px .card background color white padding 20px border radius 8px box shadow 0 2px 8px rgba 0 0 0 0.1 tablet 2 columns @media min width 600px .grid grid template columns 1fr 1fr desktop 3 columns @media min width 900px .grid grid template columns 1fr 1fr 1fr style head body div class grid div class card h3 card 1 h3 p content p div div class card h3 card 2 h3 p content p div div class card h3 card 3 h3 p content p div div class card h3 card 4 h3 p content p div div body html 1 column on mobile 2 on tablet 3 on desktop — all with min width screenshots at three different widths. mobile fi",
    "courseIdx": 1,
    "modIdx": 2,
    "lesIdx": 1
  },
  {
    "title": "Responsive Images and Media",
    "module": "Responsive Design",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 3 3 responsive images and media css 3 2 beginner 16 min 16 beginner 3 2 make images scale with their container control image cropping with object fit load different images for different screen sizes build a responsive image gallery make images responsive create a new file and save it as responsive images.html copy and paste the code below save and resize your browser images scale smoothly doctype html html head meta name viewport content width device width initial scale 1.0 title responsive images title style img max width 100% height auto display block .container max width 800px margin 0 auto padding 20px .image grid display grid grid template columns repeat auto fit minmax 200px 1fr gap 20px style head body div class container h1 responsive images h1 img src https via.placeholder.com 1200x600 alt hero div class image grid img src https via.placeholder.com 400x300 alt image 1 img src https via.placeholder.com 400x300 alt image 2 img src https via.placeholder.com 400x300 alt image 3 div div body html images scale with their container and never overflow screenshot showing responsive images at different widths. max width 100% height auto the essential responsive image rule. max w",
    "courseIdx": 1,
    "modIdx": 2,
    "lesIdx": 2
  },
  {
    "title": "Build a Responsive Card Gallery",
    "module": "Responsive Design",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 3 4 build a responsive card gallery css 3 3 intermediate 22 min 22 intermediate 4 2 create a card gallery that adapts from 1 to 4 columns use css grid with auto fit add hover effects and transitions make cards equal height automatically build the responsive grid create a new file and save it as responsive gallery.html copy and paste the code below save and open in browser resize your browser window — watch cards automatically reflow from 1 to 4 columns doctype html html head meta name viewport content width device width initial scale 1.0 title responsive gallery title style margin 0 padding 0 box sizing border box body font family arial sans serif background color f5f5f5 padding 40px 20px h1 text align center color 333 margin bottom 40px font size 36px .gallery display grid grid template columns repeat auto fit minmax 280px 1fr gap 30px max width 1400px margin 0 auto .card background color white border radius 12px overflow hidden box shadow 0 4px 12px rgba 0 0 0 0.1 transition all 0.3s ease display flex flex direction column .card hover transform translatey 8px box shadow 0 12px 24px rgba 0 0 0 0.15 .card image width 100% height 220px object fit cover .card content padding 24px",
    "courseIdx": 1,
    "modIdx": 2,
    "lesIdx": 3
  },
  {
    "title": "Responsive Typography and Spacing",
    "module": "Responsive Design",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 3 5 responsive typography and spacing css 3 4 intermediate 18 min 18 intermediate 3 3 make text scale smoothly across all screen sizes use the clamp function for fluid typography create consistent spacing with css custom properties avoid font size jumps between breakpoints create fluid typography with clamp create a new file and save it as fluid typography.html copy and paste the code below save and open in browser slowly resize your browser window — watch text scale smoothly doctype html html head meta name viewport content width device width initial scale 1.0 title fluid typography title style margin 0 padding 0 box sizing border box root space xs clamp 0.5rem 1vw 1rem space sm clamp 1rem 2vw 1.5rem space md clamp 1.5rem 3vw 2.5rem space lg clamp 2rem 5vw 4rem space xl clamp 3rem 8vw 6rem body font family arial sans serif line height 1.6 color 333 padding var space md background linear gradient 135deg 667eea 0% 764ba2 100% min height 100vh .content max width 800px margin 0 auto background color white padding var space lg border radius 16px box shadow 0 20px 60px rgba 0 0 0 0.3 h1 font size clamp 2rem 5vw 4rem margin bottom var space md color 333 line height 1.2 h2 font size c",
    "courseIdx": 1,
    "modIdx": 2,
    "lesIdx": 4
  },
  {
    "title": "Build Your Responsive Portfolio Page",
    "module": "Responsive Design",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 3 6 build your responsive portfolio page css 3 5 intermediate 30 min 30 intermediate 7 1 build a complete portfolio website from scratch combine all responsive techniques you ve learned create hero section about projects and contact sections make it work perfectly on mobile tablet and desktop build the complete portfolio create a new file and save it as my portfolio.html copy and paste the code below save and open in browser replace your name with your actual name update the about section with your story replace placeholder projects with your actual work doctype html html lang en head meta charset utf 8 meta name viewport content width device width initial scale 1.0 title your name portfolio title style margin 0 padding 0 box sizing border box root space sm clamp 1rem 2vw 1.5rem space md clamp 1.5rem 3vw 2.5rem space lg clamp 2rem 5vw 4rem space xl clamp 3rem 8vw 6rem text base clamp 1rem 2vw 1.125rem text lg clamp 1.125rem 2.5vw 1.375rem text xl clamp 1.5rem 3.5vw 2rem text 2xl clamp 2rem 5vw 3.5rem text 3xl clamp 2.5rem 6vw 5rem primary 667eea secondary 764ba2 html scroll behavior smooth body font family apple system blinkmacsystemfont arial sans serif line height 1.6 color 1",
    "courseIdx": 1,
    "modIdx": 2,
    "lesIdx": 5
  },
  {
    "title": "Add Smooth Transitions",
    "module": "Advanced Styling",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 4 1 add smooth transitions css 3 6 intermediate 18 min 18 intermediate 3 2 make hover effects smooth instead of instant control transition speed and timing create professional button and card interactions understand timing functions add hover transitions create a new file and save it as transitions.html copy and paste the code below save and open in browser hover over the button and card — smooth transitions doctype html html head title css transitions title style body padding 40px font family arial sans serif background color f5f5f5 .button background color 667eea color white padding 15px 30px border none border radius 8px font size 16px cursor pointer transition all 0.3s ease .button hover background color 5568d3 transform translatey 2px box shadow 0 4px 12px rgba 0 0 0 0.2 .card background color white padding 30px border radius 12px margin 20px 0 box shadow 0 2px 8px rgba 0 0 0 0.1 transition transform 0.3s ease box shadow 0.3s ease .card hover transform translatey 8px box shadow 0 8px 24px rgba 0 0 0 0.15 style head body button class button hover me button div class card h2 hover this card h2 p watch it lift up smoothly p div body html hover effects are now smooth instead o",
    "courseIdx": 1,
    "modIdx": 3,
    "lesIdx": 0
  },
  {
    "title": "Create CSS Animations",
    "module": "Advanced Styling",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 4 2 create css animations css 4 1 intermediate 20 min 20 intermediate 3 2 create animations that run automatically build a pulsing button effect make a loading spinner animate elements on page load create a pulsing button create a new file and save it as animations.html copy and paste the code below save and open in browser the button pulses and the spinner spins — no hovering needed doctype html html head title css animations title style body padding 60px font family arial sans serif text align center @keyframes pulse 0% transform scale 1 box shadow 0 0 0 0 rgba 102 126 234 0.7 50% transform scale 1.05 box shadow 0 0 0 10px rgba 102 126 234 0 100% transform scale 1 box shadow 0 0 0 0 rgba 102 126 234 0 .pulse button background color 667eea color white padding 20px 40px border none border radius 50px font size 18px font weight bold cursor pointer animation pulse 2s ease in out infinite @keyframes spin from transform rotate 0deg to transform rotate 360deg .spinner width 50px height 50px border 5px solid f0f0f0 border top color 667eea border radius 50% animation spin 1s linear infinite margin 40px auto style head body button class pulse button click me button div class spinner di",
    "courseIdx": 1,
    "modIdx": 3,
    "lesIdx": 1
  },
  {
    "title": "Master CSS Custom Properties",
    "module": "Advanced Styling",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 4 3 master css custom properties css 4 2 intermediate 18 min 18 intermediate 3 3 create a theme system with css variables switch between light and dark modes build a consistent design system update your entire site by changing a few values create your first css variables create a new file and save it as css variables.html copy and paste the code below save and open in browser try changing primary color in root to a different color watch everything using that variable update instantly doctype html html head title css variables title style root primary color 667eea secondary color 764ba2 text color 333 background color f9f9f9 card padding 24px border radius 12px body margin 0 padding 40px background color var background color color var text color font family arial sans serif .card background color white padding var card padding border radius var border radius margin bottom 20px box shadow 0 2px 8px rgba 0 0 0 0.1 .button background linear gradient 135deg var primary color var secondary color color white padding 12px 24px border none border radius var border radius font weight 600 cursor pointer h1 color var primary color style head body h1 css variables demo h1 div class card h2 ",
    "courseIdx": 1,
    "modIdx": 3,
    "lesIdx": 2
  },
  {
    "title": "Transforms and Advanced Effects",
    "module": "Advanced Styling",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 4 4 transforms and advanced effects css 4 3 intermediate 20 min 20 intermediate 4 3 rotate scale and skew elements create 3d card flip effects add perspective for depth build interactive hover transformations transform elements create a new file and save it as transforms.html copy and paste the code below save and open in browser hover over each box to see different transforms doctype html html head title css transforms title style body margin 0 padding 60px 40px font family arial sans serif background color f5f5f5 h2 text align center color 333 margin bottom 30px .demo grid display grid grid template columns repeat auto fit minmax 200px 1fr gap 40px max width 1000px margin 60px auto .box width 150px height 150px background linear gradient 135deg 667eea 764ba2 margin 0 auto display flex align items center justify content center color white font weight bold border radius 12px transition transform 0.3s ease .rotate hover transform rotate 45deg .scale hover transform scale 1.3 .skew hover transform skew 10deg 10deg .translate hover transform translatey 20px .multi hover transform rotate 15deg scale 1.2 translatey 10px style head body h1 style text align center color 333 css transf",
    "courseIdx": 1,
    "modIdx": 3,
    "lesIdx": 3
  },
  {
    "title": "Shadows, Filters, and Visual Effects",
    "module": "Advanced Styling",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 4 5 shadows filters and visual effects css 4 4 intermediate 18 min 18 intermediate 3 3 add realistic shadows for depth use filters to blur brighten and adjust images create glassmorphism effects build glowing elements master box shadow create a new file and save it as shadows filters.html copy and paste the code below save and open in browser see how different shadows create different levels of depth doctype html html head title shadows filters title style body margin 0 padding 60px 40px font family arial sans serif background linear gradient 135deg 667eea 0% 764ba2 100% min height 100vh h1 text align center color white margin bottom 60px .shadow examples display grid grid template columns repeat auto fit minmax 250px 1fr gap 40px max width 1200px margin 0 auto .shadow card background color white padding 40px 30px border radius 12px text align center .shadow card h3 margin 0 0 10px 0 color 333 .shadow card p margin 0 color 666 font size 14px .subtle box shadow 0 2px 8px rgba 0 0 0 0.1 .medium box shadow 0 4px 12px rgba 0 0 0 0.15 .strong box shadow 0 10px 30px rgba 0 0 0 0.2 .colored box shadow 0 8px 24px rgba 102 126 234 0.4 .layered box shadow 0 2px 4px rgba 0 0 0 0.1 0 8px 1",
    "courseIdx": 1,
    "modIdx": 3,
    "lesIdx": 4
  },
  {
    "title": "Build Your Final Portfolio Website",
    "module": "Advanced Styling",
    "course": "CSS",
    "icon": "🎨",
    "keywords": "css 4 6 build your final portfolio website css 4 5 advanced 40 min 40 advanced 24 1 combine all techniques from modules 1 4 build a production ready portfolio add animations transitions responsive design create something you re proud to share build your complete portfolio plan your color scheme primary secondary neutrals using coolors.co choose 3 6 projects to showcase write your about section create a new file final portfolio.html build section by section nav → hero → about → projects → contact → footer test at mobile tablet and desktop widths replace all placeholder content with your information this is your capstone project. use everything you ve learned required sections 1. sticky responsive navigation 2. hero with gradient background cta 3. about section with skills badges 4. projects gallery responsive grid hover effects 5. contact section 6. footer required techniques checklist module 1 colors gradients typography spacing borders shadows module 2 flexbox grid sticky positioning display properties module 3 media queries mobile first responsive images clamp module 4 transitions hover animations transforms css variables start with the portfolio template from lesson 3.6 then enh",
    "courseIdx": 1,
    "modIdx": 3,
    "lesIdx": 5
  },
  {
    "title": "Make a Button Talk",
    "module": "JavaScript Awakening",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 1 1 make a button talk beginner 15 min 15 beginner 3 3 create a button that responds when you click it make it say different messages write your first line of javascript code make a button say hello open vs code or go to codepen.io in your browser create a new file and save it as talking button.html copy and paste the code below save the file double click the file to open it in your browser click the button — you ll see a popup appear doctype html html head title my talking button title head body h1 my first javascript h1 button onclick alert hello you clicked me click me button body html you just created an interactive button that responds to clicks using javascript screenshot showing the popup message hello you clicked me after clicking your button. the button tag onclick the button creates a clickable element. the onclick attribute tells it what javascript to run when clicked. a doorbell button on a house. onclick is the wiring that connects it to the chime. alert function javascript code that shows a popup message. every browser understands alert . great for testing not great for real websites popups are annoying . a sticky note that pops up in front of everything until you ",
    "courseIdx": 2,
    "modIdx": 0,
    "lesIdx": 0
  },
  {
    "title": "Make Text Change Instantly",
    "module": "JavaScript Awakening",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 1 2 make text change instantly js 1 1 beginner 18 min 18 beginner 4 3 make text on your page change when you click a button create a name tag that updates in real time change multiple things on the page at once make a headline change open vs code or codepen create a new file and save it as changing text.html copy and paste the code below save and open in browser click the button — watch the headline change instantly doctype html html head title changing text title style h1 font size 48px color purple text align center margin top 50px button display block margin 20px auto padding 15px 30px font size 18px cursor pointer style head body h1 id headline hello world h1 button onclick changetext change the text button script function changetext document.queryselector headline .textcontent i just changed this with javascript script body html the headline text changed without reloading the page. that s javascript manipulating the dom screenshot showing the headline after clicking should say i just changed this with javascript the id attribute gives an html element a unique name like a name tag . every id on a page must be unique. in javascript you find it with id. a student id number. no",
    "courseIdx": 2,
    "modIdx": 0,
    "lesIdx": 1
  },
  {
    "title": "Control Colors and Styles",
    "module": "JavaScript Awakening",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 1 3 control colors and styles js 1 2 beginner 20 min 20 beginner 5 3 change the background color of your page with a button click build a light dark mode toggle switch control any css property with javascript build a color changing background open vs code or codepen create a new file color changer.html copy the code below save and open in your browser click each button — watch the background change instantly doctype html html head title color changer title style body text align center padding 50px transition background color 0.5s ease button padding 15px 30px font size 18px margin 10px cursor pointer border none border radius 5px h1 font size 48px margin bottom 30px style head body h1 click to change colors h1 button onclick makeblue ocean blue button button onclick makepink sunset pink button button onclick makepurple royal purple button script function makeblue document.body.style.backgroundcolor 4a90e2 document.body.style.color white function makepink document.body.style.backgroundcolor ff6b9d document.body.style.color white function makepurple document.body.style.backgroundcolor 9b59b6 document.body.style.color white script body html javascript changed the css of your page i",
    "courseIdx": 2,
    "modIdx": 0,
    "lesIdx": 2
  },
  {
    "title": "Store and Remember Information",
    "module": "JavaScript Awakening",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 1 4 store and remember information js 1 3 beginner 22 min 22 beginner 6 3 store a user s name and display it on the page build a click counter that remembers how many times you clicked create a personalized greeting that updates dynamically create a click counter open vs code or codepen create click counter.html copy the code below save and open in browser click the button multiple times — watch the number increase doctype html html head title click counter title style body text align center padding 50px font family arial sans serif counter font size 72px color e74c3c margin 30px 0 font weight bold button padding 15px 30px font size 20px cursor pointer background color 3498db color white border none border radius 5px button hover background color 2980b9 style head body h1 click counter h1 div id counter 0 div button onclick addclick click me button script let clickcount 0 function addclick clickcount clickcount 1 document.getelementbyid counter .textcontent clickcount script body html the variable clickcount remembers how many times you clicked screenshot showing the counter at 10 or higher. what is a variable a named container that holds information. let clickcount 0 creates a ",
    "courseIdx": 2,
    "modIdx": 0,
    "lesIdx": 3
  },
  {
    "title": "Create and Control Lists",
    "module": "Data Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 2 1 create and control lists js 1 4 beginner 18 min 18 beginner 5 3 create a list of favorite foods and display them add new items to a list with a button click build a dynamic to do list that grows as you add tasks display a list of items open vs code or codepen create my favorites.html copy the code below save and open in browser click show my list — see all 5 foods appear doctype html html head title my favorite foods title style body text align center padding 50px font family arial sans serif food list font size 24px margin 30px auto max width 400px text align left line height 2 button padding 15px 30px font size 18px cursor pointer background color 3498db color white border none border radius 5px margin 10px style head body h1 my favorite foods h1 div id food list div button onclick showfoods show my list button button onclick addfood style background color 2ecc71 add cookies 🍪 button script let favoritefoods pizza tacos ice cream sushi chocolate function showfoods let display for let i 0 i favoritefoods.length i display i 1 . favoritefoods i br document.getelementbyid food list .innerhtml display function addfood favoritefoods.push cookies showfoods script body html you s",
    "courseIdx": 2,
    "modIdx": 1,
    "lesIdx": 0
  },
  {
    "title": "Transform and Filter Lists",
    "module": "Data Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 2 2 transform and filter lists js 2 1 beginner 20 min 20 beginner 6 3 remove items from a list with one click filter a list to show only certain items transform an entire list with one line of code build a shopping cart with remove open vs code or codepen create shopping cart.html copy the code below save and open in browser click add apple then remove last item doctype html html head title shopping cart title style body text align center padding 50px font family arial .cart max width 400px margin 30px auto background f8f9fa padding 20px border radius 10px items font size 20px text align left line height 2 min height 100px button padding 12px 24px font size 16px cursor pointer border none border radius 5px margin 5px color white .add background 2ecc71 .remove background e74c3c style head body h1 🛒 shopping cart h1 div class cart div id items div div id count div div button class add onclick additem add apple 🍎 button button class remove onclick removelastitem remove last item button script let cart banana orange grapes function displaycart let display for let i 0 i cart.length i display i 1 . cart i br document.getelementbyid items .innerhtml display document.getelementbyid co",
    "courseIdx": 2,
    "modIdx": 1,
    "lesIdx": 1
  },
  {
    "title": "Organize Data with Objects",
    "module": "Data Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 2 3 organize data with objects js 2 2 beginner 20 min 20 beginner 6 3 create a person object with name age and hobbies build a digital business card make a mini database of multiple people create your first object open vs code or codepen create person card.html copy the code below save and open in browser click show person to see the info doctype html html head title person card title style body text align center padding 50px font family arial background ecf0f1 .card max width 400px margin 0 auto background white padding 30px border radius 15px box shadow 0 4px 6px rgba 0 0 0 0.1 .card p font size 18px color 7f8c8d margin 10px 0 .info label font weight bold color 3498db button padding 12px 24px font size 16px cursor pointer background 2ecc71 color white border none border radius 5px margin top 20px style head body div class card h2 person information h2 div id person info click the button to show info div div button onclick showperson show person button script let person name sarah chen age 28 job web developer city san francisco function showperson let display p span class info label name span $ person.name p p span class info label age span $ person.age p p span class info lab",
    "courseIdx": 2,
    "modIdx": 1,
    "lesIdx": 2
  },
  {
    "title": "Build a Data Dashboard",
    "module": "Data Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 2 4 build a data dashboard js 2 3 intermediate 22 min 22 intermediate 5 3 build a student grade tracker that calculates averages display statistics highest lowest average filter students by passing failing status create a real data dashboard calculate grade statistics open vs code or codepen create grade calculator.html copy the code below save and open in browser click calculate statistics to see the results doctype html html head title grade calculator title style body padding 50px font family arial background ecf0f1 .container max width 600px margin 0 auto background white padding 30px border radius 10px box shadow 0 2px 10px rgba 0 0 0 0.1 h1 text align center color 2c3e50 .stats display grid grid template columns repeat 3 1fr gap 15px margin 30px 0 .stat box color white padding 20px border radius 10px text align center .stat box.high background 2ecc71 .stat box.low background e74c3c .stat box.avg background 3498db .stat box h3 margin 0 0 10px font size 14px opacity 0.9 .stat box p margin 0 font size 36px font weight bold button display block width 100% padding 15px font size 18px cursor pointer background 9b59b6 color white border none border radius 5px style head body div ",
    "courseIdx": 2,
    "modIdx": 1,
    "lesIdx": 3
  },
  {
    "title": "Master Form Input and Validation",
    "module": "User Interaction Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 3 1 master form input and validation js 2 4 intermediate 20 min 20 intermediate 6 3 build a signup form that checks if inputs are valid create real time validation that gives instant feedback build a password strength checker stop bad data before it gets saved build a simple form validator open vs code or codepen create form validator.html copy the code below save and open in browser try submitting with empty fields — see error messages fill correctly — see success doctype html html head title form validator title style body display flex justify content center align items center min height 100vh margin 0 background linear gradient 135deg 667eea 764ba2 font family arial .form container background white padding 40px border radius 15px box shadow 0 10px 30px rgba 0 0 0 0.3 width 400px h1 margin 0 0 30px color 2c3e50 text align center .form group margin bottom 20px label display block margin bottom 5px color 34495e font weight bold input width 100% padding 12px font size 16px border 2px solid bdc3c7 border radius 5px box sizing border box input.error border color e74c3c input.success border color 2ecc71 .error message color e74c3c font size 14px margin top 5px display none .error me",
    "courseIdx": 2,
    "modIdx": 2,
    "lesIdx": 0
  },
  {
    "title": "Handle Events Like a Pro",
    "module": "User Interaction Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 3 2 handle events like a pro js 3 1 intermediate 22 min 22 intermediate 7 3 detect keyboard presses and respond to them build a game you control with arrow keys track mouse movements and clicks create interactive experiences that feel alive build a keyboard controlled box open vs code or codepen create keyboard control.html copy the code below save and open in browser click anywhere on the page first to give it focus press the arrow keys — watch the red box move doctype html html head title keyboard control title style body margin 0 padding 20px background color 2c3e50 font family arial overflow hidden h1 color white text align center margin bottom 10px .instructions color ecf0f1 text align center margin bottom 30px font size 18px game area position relative width 800px height 500px margin 0 auto background color 34495e border radius 10px border 3px solid 1abc9c player position absolute width 50px height 50px background color e74c3c border radius 5px top 225px left 375px transition all 0.1s ease coordinates color white text align center margin top 20px font size 20px font family monospace style head body h1 🎮 keyboard controller h1 div class instructions use arrow keys to move ",
    "courseIdx": 2,
    "modIdx": 2,
    "lesIdx": 1
  },
  {
    "title": "Make Smart Decisions with Logic",
    "module": "User Interaction Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 3 3 make smart decisions with logic js 3 2 intermediate 20 min 20 intermediate 6 3 build a quiz app that gives different responses based on answers create a shipping calculator with complex pricing rules make a recommendation engine that combines multiple conditions build a multi condition checker open vs code or codepen create age checker.html copy the code below save and open in browser try different combinations — age 15 with ticket age 10 with without parent doctype html html head title movie theater entry title style body display flex justify content center align items center min height 100vh margin 0 background linear gradient 135deg 6a11cb 2575fc font family arial .container background white padding 40px border radius 15px box shadow 0 10px 30px rgba 0 0 0 0.3 width 450px h1 text align center color 2c3e50 margin 0 0 30px .form group margin bottom 20px label display block margin bottom 8px color 34495e font weight bold input type number width 100% padding 12px font size 16px border 2px solid bdc3c7 border radius 5px box sizing border box .checkbox group display flex align items center gap 10px input type checkbox width 20px height 20px cursor pointer button width 100% padd",
    "courseIdx": 2,
    "modIdx": 2,
    "lesIdx": 2
  },
  {
    "title": "Transform Data with Map",
    "module": "Advanced Array Methods",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 4 1 transform data with map intermediate 20 min 20 intermediate 5 3 transform an array of numbers into an array of their doubles convert an array of products into an array of formatted prices build a temperature converter that transforms entire datasets double every number open vs code or codepen create array map intro.html copy the code below save and open in browser click each button and watch the transformations doctype html html head title map method intro title style body display flex justify content center align items center min height 100vh margin 0 background linear gradient 135deg 667eea 764ba2 font family arial .container background white padding 40px border radius 15px box shadow 0 10px 30px rgba 0 0 0 0.3 width 600px h1 text align center color 2c3e50 margin 0 0 30px .array display background f8f9fa padding 25px border radius 10px margin bottom 20px .array label font weight bold color 7f8c8d margin bottom 10px .array values font size 24px color 2c3e50 font family monospace background white padding 15px border radius 5px border left 4px solid 3498db button width 100% padding 15px font size 18px font weight bold cursor pointer background 9b59b6 color white border none b",
    "courseIdx": 2,
    "modIdx": 3,
    "lesIdx": 0
  },
  {
    "title": "Master Scope and Closures",
    "module": "Advanced Array Methods",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 4 2 master scope and closures js 4 1 intermediate 22 min 22 intermediate 7 3 understand why some variables are accessible and others aren t create private variables that only your functions can access build a counter that remembers its state prevent variable naming conflicts in large projects see scope in action open vs code or codepen create scope demo.html copy the code below save and open in browser open the browser console f12 click the buttons and watch the console notice which variables are accessible where doctype html html head title scope demo title style body display flex justify content center align items center min height 100vh margin 0 background linear gradient 135deg 667eea 764ba2 font family arial .container background white padding 40px border radius 15px box shadow 0 10px 30px rgba 0 0 0 0.3 width 600px h1 text align center color 2c3e50 margin 0 0 30px .demo section background f8f9fa padding 20px border radius 10px margin bottom 20px border left 5px solid 667eea .demo section h3 margin 0 0 15px color 2c3e50 button padding 12px 24px font size 16px font weight bold cursor pointer background 667eea color white border none border radius 5px margin 5px .console note",
    "courseIdx": 2,
    "modIdx": 3,
    "lesIdx": 1
  },
  {
    "title": "Arrow Functions and Callbacks",
    "module": "Advanced Array Methods",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 4 3 arrow functions and callbacks js 4 2 intermediate 20 min 20 intermediate 6 3 write concise arrow functions instead of long function syntax transform arrays with .map .filter and .reduce pass functions as arguments to other functions chain array methods to process data elegantly transform data with array methods open vs code or codepen create array methods.html copy the code below save and open in browser click each button to see different transformations notice how much cleaner this is than loops doctype html html head title modern array methods title style body padding 50px background linear gradient 135deg 667eea 764ba2 font family arial .container max width 900px margin 0 auto background white padding 40px border radius 15px h1 text align center color 2c3e50 margin 0 0 40px .demo section background f8f9fa padding 25px border radius 10px margin bottom 25px border left 5px solid 667eea .demo section h3 margin 0 0 15px color 2c3e50 button padding 12px 24px font size 16px font weight bold cursor pointer background 667eea color white border none border radius 5px margin right 10px margin bottom 10px .result background white padding 20px border radius 5px margin top 15px font f",
    "courseIdx": 2,
    "modIdx": 3,
    "lesIdx": 2
  },
  {
    "title": "Organize Code Like a Pro",
    "module": "Advanced Array Methods",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 4 4 organize code like a pro js 4 3 intermediate 24 min 24 intermediate 8 2 true break a messy 500 line file into organized modules follow the dry principle don t repeat yourself create helper functions that make code readable build a complete app with professional code organization use design patterns that real developers use refactor messy code into organized modules open vs code or codepen create organized app.html copy the code below notice how it s organized save and open in browser click around and see a fully functional app read the code — notice how every function has one clear job doctype html html head title professional code organization title style body margin 0 padding 0 background linear gradient 135deg 667eea 764ba2 font family arial min height 100vh .app container max width 800px margin 0 auto padding 40px 20px .app header .task input section .filters .tasks section background white padding 25px border radius 15px margin bottom 20px box shadow 0 10px 30px rgba 0 0 0 0.3 .app header text align center .app header h1 color 2c3e50 margin 0 0 10px .input group display flex gap 10px input flex 1 padding 12px font size 16px border 2px solid bdc3c7 border radius 5px butt",
    "courseIdx": 2,
    "modIdx": 3,
    "lesIdx": 3
  },
  {
    "title": "Fetch Data from APIs",
    "module": "APIs and Async JavaScript",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 5 1 fetch data from apis js 4 4 intermediate 22 min 22 intermediate 8 3 connect your code to real apis on the internet fetch live weather data user profiles and more display dynamic content from external sources build apps that use real time information build a weather app with real api data create weather app.html copy the code — a complete weather app enter a city name and click get weather see real weather data from openweathermap api try different cities — it s pulling live data const api_key your key here const api_url https api.openweathermap.org data 2.5 weather function getweather const city document.getelementbyid city input .value const url $ api_url q $ city appid $ api_key units metric fetch url .then response if response.ok throw new error city not found return response.json .then data document.getelementbyid city name .textcontent $ data.name $ data.sys.country document.getelementbyid temperature .textcontent $ math.round data.main.temp °c document.getelementbyid description .textcontent data.weather 0 .description .catch error console.error error error alert city not found. please try again. you fetched real weather data from an api showing weather data for at lea",
    "courseIdx": 2,
    "modIdx": 4,
    "lesIdx": 0
  },
  {
    "title": "Master Async/Await",
    "module": "APIs and Async JavaScript",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 5 2 master async await js 5 1 intermediate 20 min 20 intermediate 6 3 write asynchronous code that reads like normal code get rid of messy .then chains handle multiple api calls elegantly make async code cleaner and easier to understand convert promise code to async await create async await demo.html copy the code — side by side comparison click both buttons and compare notice they do the same thing different syntax old way .then chains function getmovieoldway fetch apiurl .then response response.json .then data displaymovie data .catch error console.error error new way async await async function getmovienewway try const response await fetch apiurl const data await response.json displaymovie data catch error console.error error both do the same thing but async await is much cleaner showing movie data fetched using both methods async keyword makes a function always return a promise. async function greet return hello — greet returns promise hello . putting a this is async label on a function so javascript knows to handle it specially. await keyword pauses the async function until the promise resolves then returns the value. only works inside async functions. a pause button — wait ",
    "courseIdx": 2,
    "modIdx": 4,
    "lesIdx": 1
  },
  {
    "title": "Handle Loading States and Errors",
    "module": "APIs and Async JavaScript",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 5 3 handle loading states and errors js 5 2 intermediate 20 min 20 intermediate 6 3 show users when data is loading no more blank screens handle errors gracefully with helpful messages add retry functionality when requests fail build professional uis that feel polished build a professional loading system create loading states.html copy the code — 6 different loading patterns click each button to see spinner skeleton dots error with retry progress bar network error each gives the user clear feedback async function fetchwithretry url retries 3 for let i 0 i retries i try const response await fetch url if response.ok throw new error http $ response.status return await response.json catch error if i retries 1 throw error console.log retry $ i 1 $ retries await new promise r settimeout r 1000 i 1 async function fetchwithtimeout url timeout 5000 const controller new abortcontroller const timeoutid settimeout controller.abort timeout try const response await fetch url signal controller.signal cleartimeout timeoutid return response catch error cleartimeout timeoutid if error.name aborterror throw new error request timeout throw error you saw 6 professional loading patterns spinner skele",
    "courseIdx": 2,
    "modIdx": 4,
    "lesIdx": 2
  },
  {
    "title": "Build a Complete API-Powered App",
    "module": "APIs and Async JavaScript",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 5 4 build a complete api powered app js 5 3 intermediate 24 min 24 intermediate 8 2 build a complete cryptocurrency tracker with live data combine multiple apis into one cohesive application implement caching auto refresh and search create a real world app you can actually use build a live cryptocurrency tracker create crypto tracker.html copy the complete application code watch live crypto prices update try searching for different coins notice caching auto refresh error handling — all production patterns const api_base https api.coingecko.com api v3 const cache_duration 60000 let cache data null timestamp null let autorefreshenabled true async function fetchcryptodata check cache first if cache.data date.now cache.timestamp cache_duration return cache.data const response await fetchwithtimeout $ api_base coins markets vs_currency usd order market_cap_desc per_page 20 10000 if response.ok throw new error http $ response.status const data await response.json cache data timestamp date.now return data async function loadanddisplaydata try showskeletoncards const coins await fetchcryptodata displaymarketstats coins displaycryptocards coins updatetimestamp catch error showerror error",
    "courseIdx": 2,
    "modIdx": 4,
    "lesIdx": 3
  },
  {
    "title": "Create Elements Dynamically",
    "module": "DOM Manipulation Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 6 1 create elements dynamically js 5 4 intermediate 20 min 20 intermediate 7 3 create html elements with javascript add remove and modify elements on the fly build interactive comments and cards use textcontent safely instead of innerhtml build a dynamic comment section create dynamic comments.html copy the code — a complete comment system post comments that appear without refreshing delete with the delete button all built with createelement — no hardcoded html function createcommentelement author text commentid const comment document.createelement div comment.classname comment comment.dataset.id commentid const authorel document.createelement div authorel.textcontent author const textel document.createelement div textel.textcontent text const deletebtn document.createelement button deletebtn.textcontent delete deletebtn.addeventlistener click comment.remove comment.appendchild authorel comment.appendchild textel comment.appendchild deletebtn document.getelementbyid comments list .insertbefore comment commentslist.firstchild you created html elements with javascript 3 comments created with delete working createelement creates a new html element in memory. set properties then app",
    "courseIdx": 2,
    "modIdx": 5,
    "lesIdx": 0
  },
  {
    "title": "Manipulate the DOM Like a Pro",
    "module": "DOM Manipulation Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 6 2 manipulate the dom like a pro js 6 1 intermediate 22 min 22 intermediate 7 3 find any element with queryselector navigate the dom tree toggle classes and styles dynamically build tabbed interfaces with event delegation build an interactive image gallery create gallery navigation.html click thumbnails to change the main image previous next buttons and keyboard arrows active thumbnail highlighting with classlist document.getelementbyid thumbnails .addeventlistener click e if e.target.classlist.contains thumbnail const index parseint e.target.dataset.index showimage index function showimage index currentindex index mainimage.src thumbnails index .src document.queryselector .thumbnail.active .classlist.remove active thumbnails index .classlist.add active document.addeventlistener keydown e if e.key arrowleft navigate 1 if e.key arrowright navigate 1 gallery with queryselector classlist event delegation keyboard nav gallery with keyboard navigation and active states queryselector find elements with css selectors. queryselector .btn.active returns first match. queryselectorall returns all. css selectors in javascript — same syntax you already know. classlist .add .remove .toggle .",
    "courseIdx": 2,
    "modIdx": 5,
    "lesIdx": 1
  },
  {
    "title": "Animate Elements with JavaScript",
    "module": "DOM Manipulation Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 6 3 animate elements with javascript js 6 2 intermediate 24 min 24 intermediate 6 3 create smooth scroll triggered animations build animated counters and progress bars master intersection observer api create parallax and reveal effects build scroll triggered reveal animations create scroll animations.html scroll down slowly watch elements fade in and slide up see counters animate when visible uses intersection observer — modern and performant const observer new intersectionobserver entries entries.foreach entry if entry.isintersecting entry.target.classlist.add active if entry.target.classlist.contains stat card animatecounter entry.target threshold 0.1 rootmargin 0px 0px 100px 0px document.queryselectorall .reveal .feature card .stat card .foreach el observer.observe el function animatecounter element const target parseint element.dataset.count const numel element.queryselector .stat number let current 0 const increment target 2000 16 function update current increment if current target numel.textcontent math.floor current requestanimationframe update else numel.textcontent target requestanimationframe update scroll reveals animated counters and parallax — all performant page wi",
    "courseIdx": 2,
    "modIdx": 5,
    "lesIdx": 2
  },
  {
    "title": "Build Interactive Components",
    "module": "DOM Manipulation Mastery",
    "course": "JS",
    "icon": "⚡",
    "keywords": "js 6 4 build interactive components js 6 3 intermediate 28 min 28 intermediate 8 2 build 5 essential ui components from scratch modals dropdowns tabs accordions tooltips master accessibility keyboard aria handle focus management and escape key build a complete component library create component library.html copy the code — 5 production ready components try each modal dropdown tabs accordion tooltip use keyboard tab enter escape arrows production ready code you can reuse modal function openmodal id document.getelementbyid id .classlist.add active document.body.style.overflow hidden document.addeventlistener keydown e if e.key escape closeallmodals dropdown close on outside click document.addeventlistener click e if e.target.closest .dropdown document.queryselectorall .dropdown menu.active .foreach m m.classlist.remove active tabs event delegation keyboard tablist.addeventlistener click e if e.target.matches .tab activatetab e.target tablist.addeventlistener keydown e if e.key arrowright focusnexttab if e.key arrowleft focusprevtab accordion toggle with delegation accordion.addeventlistener click e const header e.target.closest .accordion header if header header.classlist.toggle acti",
    "courseIdx": 2,
    "modIdx": 5,
    "lesIdx": 3
  },
  {
    "title": "What is React?",
    "module": "React Fundamentals",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r1 1 what is react beginner 20 min react is a javascript library by facebook for building user interfaces. instead of manually updating the page react does it automatically. virtual dom react keeps a virtual copy in memory compares it to the real page and only updates what changed. like a smart diff tool. declarative vs imperative imperative step by step directions. declarative just say the destination. react is declarative. component based react apps are built from small reusable pieces called components. like lego bricks composing into complex structures. imperative vanilla js — you manage every step const btn document.queryselector btn btn.addeventlistener click const p document.createelement p p.textcontent clicked document.body.appendchild p declarative react — describe what you want function app const clicked setclicked usestate false return div button onclick setclicked true click button clicked p clicked p div react lets you describe what your ui should look like and it handles all the messy dom updates for you. compare the vanilla js counter vs react counter — notice how react updates are smoother create my first react.html with cdn scripts and a helloworld component chang",
    "courseIdx": 3,
    "modIdx": 0,
    "lesIdx": 0
  },
  {
    "title": "JSX Basics",
    "module": "React Fundamentals",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r1 2 jsx basics r1 1 beginner 25 min jsx is javascript not html. it looks like html but gets transformed into react.createelement calls by babel. use for javascript expressions variables name math 2 2 ternary x 10 big small object properties user.name . use classname instead of class class is reserved in js . use camelcase for attributes onclick onchange tabindex. all tags must close in jsx img input br . no exceptions. you cannot use if else inside . use ternary operators instead condition yes no . function greeting const name sarah const age 25 const isstudent true return div h1 hello name h1 p age age p p math works 2 2 p p status isstudent student not a student p div dynamic content rendered from javascript variables using curly braces watch jsx transform to react.createelement — understand what babel does embed javascript expressions in jsx using — variables math ternaries fix 5 common jsx mistakes class→classname self closing tags camelcase ternary instead of if else build a profile card with variables for name title skills array and isavailable boolean build a product card with dynamic pricing show product name original price calculate 20% discount show sale badge if on sale",
    "courseIdx": 3,
    "modIdx": 0,
    "lesIdx": 1
  },
  {
    "title": "Components Introduction",
    "module": "React Fundamentals",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r1 3 components introduction r1 2 beginner 30 min components are just javascript functions that return jsx. nothing magical about them. component names must start with capital letters. react uses this to distinguish button component from button html . components can use other components — this is composition. build complex uis from simple parts like lego. single responsibility each component should do one thing well. if it does too much split it up. in real projects each component lives in its own file with export import. function header return header h1 my blog h1 header function article return article h2 my post h2 p content here. p article function footer return footer p © 2024 my blog p footer compose them into a page function blogpage return div header article article footer div a full page built from 4 small components article is reused twice. create a welcomemessage component and use it 3 times compose header article and footer into a blogpage split a big usercard into avatar userinfo and followbutton components build a reusable card component for a dashboard build a blog post preview using composition authorinfo component name avatar postcontent title excerpt posttags 2 3 t",
    "courseIdx": 3,
    "modIdx": 0,
    "lesIdx": 2
  },
  {
    "title": "Props Basics",
    "module": "React Fundamentals",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r1 4 props basics r1 3 beginner 35 min props are like function arguments — they let you pass data into a component. same component different data reusable props are read only. never modify props inside a component. react needs to control when data changes. destructuring props instead of props.name everywhere use name age in the function parameter. cleaner code. default props give props fallback values with name guest . component works even without all props provided. props can be any type strings numbers booleans arrays objects even functions. function usercard name title avatar isonline return div style border 2px solid e2e8f0 borderradius 12px padding 20px display flex alignitems center gap 15px div style fontsize 3em avatar div div h3 name h3 p title p span style color isonline 48bb78 999 isonline 🟢 online ⚫ offline span div div same component different data usercard name sarah title developer avatar 👩‍💻 isonline true usercard name alex title designer avatar 🎨 isonline false two completely different user cards from the same component — that is the power of props pass your first prop — a name to a greeting component build a usercard with name title avatar and isonline props u",
    "courseIdx": 3,
    "modIdx": 0,
    "lesIdx": 3
  },
  {
    "title": "State Basics with useState",
    "module": "React Fundamentals",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r1 5 state basics with usestate r1 4 beginner 40 min state is component memory — data that lives inside the component and can change. props come from outside state is your own. usestate returns currentvalue setterfunction . always use the setter — never modify state directly. state changes trigger re renders. when you call setcount 5 react re runs your component with the new value and updates the dom. each component instance gets its own state. two counter components have independent counts. props vs state props are passed from parent read only . state is defined inside can be updated . props are function params state is local variables. never modify state directly count won t work. always use setcount count 1 . only the setter triggers re renders. functional updates when new state depends on old state use setcount prev prev 1 . ensures correctness with rapid updates. function counter const count setcount usestate 0 return div h2 count count h2 button onclick setcount count 1 add 1 button button onclick setcount count 1 subtract 1 button button onclick setcount 0 reset button div like button with toggle function likebutton const likes setlikes usestate 0 const isliked setisliked us",
    "courseIdx": 3,
    "modIdx": 0,
    "lesIdx": 4
  },
  {
    "title": "Event Handling",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 1 event handling r1 5 beginner 30 min react events use camelcase onclick onchange and pass function references not strings. pass handleclick not handleclick . the event object react passes a synthetic event with target type clientx. use event.target.value for input values. common events onclick buttons onchange inputs onsubmit forms onmouseenter leave hover onkeydown keyboard . prevent default use event.preventdefault in form handlers to stop page refresh on submit. passing handlers as props parent defines the function child receives it via props and calls it on events. function clickcounter const count setcount react.usestate 0 function handleclick setcount count 1 return div p clicked count times p button onclick handleclick click me button div input tracking function nameinput const name setname react.usestate return div input onchange e setname e.target.value p hello name stranger p div interactive counter and live name input — events make react components respond to users handle your first click event — build a counter capture form input changes with onchange pass event handlers as props to child components prevent default form submission with preventdefault build an intera",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 0
  },
  {
    "title": "Conditional Rendering",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 2 conditional rendering r2 1 beginner 25 min ternary operator for two options. condition showthis showthat . like if else inline. logical and show something or nothing. condition showthis . perfect for error messages badges. if else before return for complex logic with multiple conditions. calculate what to show then return it. variables for jsx store jsx in variables for readable complex conditions. let content isloggedin dashboard login function welcomemessage const isloggedin setisloggedin react.usestate false return div isloggedin h1 welcome back h1 h1 please log in h1 button onclick setisloggedin isloggedin isloggedin log out log in button div the ui changes based on state — logged in shows welcome logged out shows login prompt toggle login state with ternary operator show error messages conditionally with build multi state ui idle → loading → success → error use if else before return for complex logic build a theme switcher toggle light dark mode. different background and text colors. button text changes. show sun or moon emoji. i used when i needed ternary and couldn t figure out why my else case never showed. show or nothing. ternary a or b. know the difference. react fu",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 1
  },
  {
    "title": "Lists and Keys",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 3 lists and keys r2 2 beginner 32 min .map transforms arrays into jsx users.map user usercard key user.id user user . this is how lists render in react. keys help react track items unique identifier for each list item. react uses keys to know what changed was added or removed. good keys vs bad keys use stable ids from data user.id . avoid array index as key — breaks when items reorder. keys must be unique among siblings not globally. two different lists can use the same key values. function userlist const users id 1 name sarah role developer id 2 name alex role designer id 3 name jordan role manager return ul users.map user li key user.id strong user.name strong — user.role li ul a dynamic list rendered from an array. add items to the array and the ui updates automatically render an array of strings with .map render objects with multiple properties combine .filter and .map to show specific items build a shopping list with add remove build a contact list array of contacts id name email phone . display with .map and proper keys. add search input to filter by name. show no contacts found when empty. i ignored the key warning for weeks. then i built a sortable list and items kept ju",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 2
  },
  {
    "title": "Controlled Forms",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 4 controlled forms r2 3 beginner 35 min controlled components input value is managed by react state. value name onchange setname . single source of truth. why controlled easy validation can modify input before display easy reset consistent data flow. react owns the data. multiple inputs use object state with spread. setstate ...state e.target.name e.target.value handles any field. form submission always use onsubmit event.preventdefault . never let the form refresh the page. different input types text value checkbox checked select value textarea value . each follows the same controlled pattern. function nameform const name setname react.usestate function handlesubmit e e.preventdefault alert hello $ name return form onsubmit handlesubmit input type text value name onchange e setname e.target.value placeholder enter your name button type submit submit button form a controlled form where react manages the input value. submit shows an alert with the entered name. create a controlled text input handle multiple form fields with object state add form validation email format password length build a complete form with different input types build a survey form name text age number favori",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 3
  },
  {
    "title": "Weather Dashboard Project",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 5 weather dashboard project r2 4 intermediate 90 min full project combining all module 1 concepts components props state events conditionals lists forms. component architecture app container → searchform weatherdisplay favoriteslist. each has one job. async operations mock api with promises. loading → success error states. real world data flow pattern. complex state multiple usestate hooks working together weather favorites loading error searchcity . architecture weatherapp all state lives here ├── searchform controlled input submit ├── weatherdisplay current forecast └── favoriteslist saved cities function weatherapp const weather setweather react.usestate null const favorites setfavorites react.usestate const loading setloading react.usestate false const error seterror react.usestate async function handlesearch cityname setloading true seterror try const data await getweather cityname setweather data catch err seterror err.message setweather null finally setloading false searchform weatherdisplay favoriteslist each receive props from this parent a complete weather dashboard with search current weather forecast favorites and loading error states set up component structure with ",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 4
  },
  {
    "title": "Task Manager Project",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 6 task manager project r2 5 intermediate 120 min full crud project create read update toggle complete delete tasks. manages arrays of objects in state. form validation prevent empty submissions. priority levels high medium low with color coding. filter functionality show all active or completed tasks. task counter shows remaining items. localstorage persistence tasks survive page refresh. useeffect syncs state to localstorage on every change. function taskmanager const tasks settasks react.usestate const inputvalue setinputvalue react.usestate const filter setfilter react.usestate all const priority setpriority react.usestate medium save to localstorage on every change react.useeffect localstorage.setitem tasks json.stringify tasks tasks function handleaddtask e e.preventdefault if inputvalue.trim return settasks ...tasks id date.now text inputvalue completed false priority setinputvalue function handletoggle id settasks tasks.map t t.id id ...t completed t.completed t function handledelete id settasks tasks.filter t t.id id a complete task manager with add complete delete filter priority and localstorage persistence set up state structure for tasks array build controlled add ta",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 5
  },
  {
    "title": "Module 1 Summary",
    "module": "React Fundamentals — Part 2",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r2 7 module 1 summary r2 6 beginner 20 min module 1 complete 12 lessons 2 full projects 30 react fundamentals mastered 25 components created. core skills react jsx components props state events conditional rendering lists keys controlled forms. you built a weather dashboard and a task manager — real applications with real patterns. skill level junior react developer. you can build todo lists dashboards form apps crud apps and component libraries. your module 1 journey lesson 1 what is react → first component lesson 5 state → interactive counter lesson 10 weather dashboard → real app lesson 11 task manager → crud mastery skills unlocked ✓ jsx syntax ✓ components composition ✓ props data in ✓ state data that changes ✓ events user interaction ✓ conditional rendering ✓ lists keys ✓ controlled forms ✓ localstorage ✓ loading error states next module 2 — component design patterns you can now build real react applications. module 2 teaches professional patterns used in production. portfolio challenge polish your weather dashboard and task manager add them to your portfolio and share in wins. the day i finished my first react module i rewrote my personal website in react. it took 3 hours an",
    "courseIdx": 3,
    "modIdx": 1,
    "lesIdx": 6
  },
  {
    "title": "useEffect Deep Dive",
    "module": "Side Effects & Data Fetching",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r9 1 useeffect deep dive r19 9 intermediate 30 min side effects operations that reach outside your component — api calls timers subscriptions dom manipulation localstorage. useeffect dependency array mount only. x when x changes. no array every render usually a bug . cleanup functions return a function from useeffect to prevent memory leaks. runs on unmount and before re running the effect. avoiding infinite loops never update state that s in the dependency array without a condition. useeffect setstate that state in deps infinite loop. effect with cleanup and dependencies function onlinestatus const isonline setisonline react.usestate true react.useeffect const handleonline setisonline true const handleoffline setisonline false window.addeventlistener online handleonline window.addeventlistener offline handleoffline cleanup remove listeners on unmount return window.removeeventlistener online handleonline window.removeeventlistener offline handleoffline set up once on mount return span isonline 🟢 online 🔴 offline span online offline detector with proper cleanup. the event listeners are removed when the component unmounts. build an online offline status detector with cleanup update",
    "courseIdx": 3,
    "modIdx": 2,
    "lesIdx": 0
  },
  {
    "title": "Fetching Data from APIs",
    "module": "Side Effects & Data Fetching",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r9 2 fetching data from apis r9 1 intermediate 35 min fetch pattern useeffect with async function inside can t make useeffect itself async . loading → success error state machine. abortcontroller cancel in flight requests when component unmounts or dependencies change. prevents set state on unmounted component warnings. loading states always show loading ui while fetching. never render empty stale data during a fetch. error handling wrap fetch in try catch. show error ui with retry button. don t silently fail. function userprofile userid const user setuser react.usestate null const loading setloading react.usestate true const error seterror react.usestate null react.useeffect const controller new abortcontroller async function fetchuser setloading true seterror null try const res await fetch api users $ userid signal controller.signal if res.ok throw new error user not found const data await res.json setuser data catch err if err.name aborterror seterror err.message finally setloading false fetchuser return controller.abort cancel on cleanup userid re fetch when userid changes if loading return p loading... p if error return p error error p return h1 user.name h1 professional data ",
    "courseIdx": 3,
    "modIdx": 2,
    "lesIdx": 1
  },
  {
    "title": "Custom Hooks",
    "module": "Side Effects & Data Fetching",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r9 3 custom hooks r9 2 intermediate 30 min custom hooks functions starting with use that extract reusable stateful logic. they can use usestate useeffect and other hooks. rules of hooks only call at the top level not in loops conditions . only call from react functions or custom hooks. usefetch encapsulates the fetch loading error pattern into one reusable hook. call it anywhere. uselocalstorage usestate but synced to localstorage. data persists across page refreshes. usefetch — reusable data fetching hook function usefetch url const data setdata react.usestate null const loading setloading react.usestate true const error seterror react.usestate null react.useeffect const controller new abortcontroller setloading true fetch url signal controller.signal .then res res.json .then data setdata data setloading false .catch err if err.name aborterror seterror err.message setloading false return controller.abort url return data loading error usage — one line to fetch anything function userlist const data users loading error usefetch api users if loading return p loading... p if error return p error error p return ul users.map u li key u.id u.name li ul usefetch encapsulates all fetch logi",
    "courseIdx": 3,
    "modIdx": 2,
    "lesIdx": 2
  },
  {
    "title": "useReducer — Complex State Logic",
    "module": "Advanced State Management",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r15 1 usereducer — complex state logic r9 3 intermediate 35 min usereducer like usestate but for complex state. dispatch action → reducer state action → newstate. pure function predictable transitions. actions objects with type field. type increment or type set_name payload jenna . describe what happened not how. when to use multiple related state values complex transitions state logic you want to test independently. usestate for simple usereducer for complex. function reducer state action switch action.type case add_item return ...state items ...state.items action.payload case remove_item return ...state items state.items.filter i i.id action.payload case set_filter return ...state filter action.payload case clear return ...state items default return state function todoapp const state dispatch react.usereducer reducer items filter all dispatch type add_item payload id 1 text learn react all state transitions in one predictable reducer. easy to test easy to debug. build a counter with usereducer create a shopping cart reducer build a form with usereducer compare usestate vs usereducer multi step wizard 3 steps next previous validation progress indicator review step. i had 8 usestat",
    "courseIdx": 3,
    "modIdx": 3,
    "lesIdx": 0
  },
  {
    "title": "Context API — Global State",
    "module": "Advanced State Management",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r15 2 context api — global state r15 1 intermediate 35 min context solves prop drilling put state in context any component accesses it directly. createcontext provider usecontext. multiple contexts authcontext for user themecontext for ui cartcontext for shopping. don t put everything in one context. when not to use frequently changing values cause all consumers to re render. context is best for slow changing data theme auth locale . const themecontext react.createcontext function themeprovider children const theme settheme react.usestate dark const toggle settheme t t dark light dark return themecontext.provider value theme toggle children themecontext.provider function usetheme return react.usecontext themecontext any component accesses theme — no drilling function header const theme toggle usetheme return header style background theme dark 1a1a2e fff button onclick toggle toggle button header theme available everywhere without prop drilling. custom usetheme hook for clean access. create themecontext with toggle build authcontext for login state use multiple contexts in one app create custom hooks for each context complete app state authcontext cartcontext uicontext — each with p",
    "courseIdx": 3,
    "modIdx": 3,
    "lesIdx": 1
  },
  {
    "title": "Context + useReducer Pattern",
    "module": "Advanced State Management",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r15 3 context usereducer pattern r15 2 intermediate 40 min context usereducer the scalable react pattern. context provides access usereducer manages transitions. essentially simplified redux. action creators functions returning action objects. addtocart item returns type add payload item . cleaner than raw dispatch. this pattern handles medium complexity apps. for large apps consider zustand or redux toolkit. const cartcontext react.createcontext function cartreducer state action switch action.type case add const exists state.find i i.id action.payload.id if exists return state.map i i.id action.payload.id ...i qty i.qty 1 i return ...state ...action.payload qty 1 case remove return state.filter i i.id action.payload case clear return default return state function cartprovider children const items dispatch react.usereducer cartreducer const add item dispatch type add payload item const remove id dispatch type remove payload id const total items.reduce s i s i.price i.qty 0 return cartcontext.provider value items total add remove children cartcontext.provider function usecart return react.usecontext cartcontext complete cart store with context usereducer. clean api via custom usecar",
    "courseIdx": 3,
    "modIdx": 3,
    "lesIdx": 2
  },
  {
    "title": "React.memo, useMemo, useCallback",
    "module": "Performance Optimization",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r16 1 react.memo usememo usecallback r15 3 intermediate 30 min react.memo wraps a component to skip re renders if props haven t changed. only for expensive components. usememo memoize expensive calculations. const sorted usememo items.sort items . only recalculates when dependencies change. usecallback memoize functions to prevent child re renders. const handleclick usecallback ... deps . stabilizes function references. when not to optimize premature optimization is the root of all evil. profile first optimize second. most components don t need memoization. react.memo — skip re render if props unchanged const expensivelist react.memo function expensivelist items console.log expensivelist rendered return ul items.map i li key i.id i.name li ul usememo — cache expensive calculation function dashboard transactions const total react.usememo console.log recalculating total... return transactions.reduce sum t sum t.amount 0 transactions only recalculates when transactions change return h2 total $ total h2 usecallback — stabilize function reference function parent const count setcount react.usestate 0 const handleclick react.usecallback console.log clicked same function reference every re",
    "courseIdx": 3,
    "modIdx": 4,
    "lesIdx": 0
  },
  {
    "title": "Code Splitting & Lazy Loading",
    "module": "Performance Optimization",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r16 2 code splitting lazy loading r16 1 intermediate 25 min react.lazy load components only when needed. const adminpage react.lazy import . adminpage . reduces initial bundle. suspense shows fallback ui while lazy component loads. suspense fallback spinner adminpage suspense . route based splitting lazy load each page route. users only download the code for pages they visit. error boundaries catch errors from lazy components with componentdidcatch or error boundary libraries. const adminpage react.lazy import . adminpage const settingspage react.lazy import . settingspage function app return div nav ... nav react.suspense fallback div loading... div page admin adminpage page settings settingspage react.suspense div adminpage only downloads when user navigates to it. initial bundle stays small. lazy load a heavy component add suspense fallback with skeleton loader code split routes measure bundle size reduction lazy loaded admin panel 5 pages with lazy loading skeleton states error boundaries retry mechanism. our app took 8 seconds to load. code splitting routes cut it to 2 seconds. same app same features 4x faster. performance optimization react react javascript library for buildi",
    "courseIdx": 3,
    "modIdx": 4,
    "lesIdx": 1
  },
  {
    "title": "List Virtualization & Advanced Performance",
    "module": "Performance Optimization",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r16 3 list virtualization advanced performance r16 2 advanced 30 min virtual scrolling only render visible rows in a long list. 100 000 items only render ~20 visible ones. react window library. infinite scroll load more data as user scrolls near the bottom. combine with virtualization for massive lists. image lazy loading use loading lazy or intersection observer to defer off screen images. concept virtual scrolling instead of rendering 100 000 li elements only render the ~20 that are visible in the viewport as user scrolls swap which items are rendered with react window import fixedsizelist from react window function virtuallist items const row index style div style style items index .name div return fixedsizelist height 400 itemcount items.length itemsize 35 width 100% row fixedsizelist 100 000 rows rendered smoothly. only visible rows are in the dom. implement virtual scrolling with react window build infinite scroll with loading indicator lazy load images with intersection observer profile and optimize a slow list high performance data grid 100k rows column sorting filtering virtual scrolling fixed header csv export. i rendered 50 000 list items without virtualization. the page",
    "courseIdx": 3,
    "modIdx": 4,
    "lesIdx": 2
  },
  {
    "title": "React Router Basics",
    "module": "Routing & Navigation",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r13 1 react router basics r16 3 intermediate 35 min client side routing navigate between pages without full page reload. browserrouter routes route. link vs anchor link to about navigates without reload. a href about causes full page refresh. always use link. url parameters post id captures dynamic segments. useparams extracts them. post 42 → id 42 . nested routes routes inside routes for layouts. dashboard wraps dashboard posts and dashboard settings. 404 handling route path element notfound catches all unmatched urls. import browserrouter routes route link useparams from react router dom function app return browserrouter nav link to home link link to posts posts link link to about about link nav routes route path element home route path posts element postlist route path post id element postdetail route path about element about route path element notfound routes browserrouter function postdetail const id useparams return h1 post id h1 multi page app with navigation dynamic routes and 404 handling. no page reloads set up browserrouter with 3 routes create navigation with link components use url parameters for dynamic pages add nested routes for a dashboard layout handle 404s multi ",
    "courseIdx": 3,
    "modIdx": 5,
    "lesIdx": 0
  },
  {
    "title": "Protected Routes & Advanced Routing",
    "module": "Routing & Navigation",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r13 2 protected routes advanced routing r13 1 intermediate 30 min protected routes check auth before showing a page. if not logged in redirect to login. usenavigate programmatic navigation. navigate dashboard after login navigate 1 to go back. usesearchparams read write url query parameters. search q react → searchparams.get q → react . navigate component declarative redirect. navigate to login redirects immediately. function protectedroute children const user useauth if user return navigate to login return children usage route path dashboard element protectedroute dashboard protectedroute programmatic navigation function loginpage const navigate usenavigate const handlelogin async await login email password navigate dashboard redirect after login query parameters function searchpage const params setparams usesearchparams const query params.get q url search q react protected routes redirect unauthenticated users. query params power search and filters via the url. build a protectedroute component navigate programmatically after login use query parameters for search redirect after authentication e commerce store protected routes cart checkout account query params for filters redirect",
    "courseIdx": 3,
    "modIdx": 5,
    "lesIdx": 1
  },
  {
    "title": "Advanced Form Patterns",
    "module": "Forms & Validation",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r8 1 advanced form patterns r13 2 intermediate 30 min controlled vs uncontrolled controlled react owns the value value onchange . uncontrolled dom owns it ref . controlled is preferred. validation patterns validate on change instant feedback on blur when leaving field on submit all at once . choose based on ux needs. error state store errors as an object email required password too short . display inline next to each field. multiple inputs use one state object spread. onchange e setstate ...state e.target.name e.target.value . function contactform const form setform react.usestate name email message const errors seterrors react.usestate const validate const errs if form.name errs.name name is required if form.email.includes @ errs.email invalid email if form.message.length 10 errs.message min 10 characters seterrors errs return object.keys errs .length 0 const handlesubmit e e.preventdefault if validate alert form submitted const handlechange e setform ...form e.target.name e.target.value return form onsubmit handlesubmit input name name value form.name onchange handlechange errors.name span classname error errors.name span input name email value form.email onchange handlechange er",
    "courseIdx": 3,
    "modIdx": 6,
    "lesIdx": 0
  },
  {
    "title": "React Hook Form & Yup",
    "module": "Forms & Validation",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r8 2 react hook form yup r8 1 intermediate 35 min react hook form form library that uses refs for performance. useform gives register handlesubmit errors. minimal re renders. register connects inputs to the form. input ...register email required true . no onchange or value needed yup validation schema based validation. define rules as an object rhf validates against it automatically. field arrays dynamic lists of inputs work experience skills . usefieldarray manages add remove. import useform from react hook form import as yup from yup import yupresolver from @hookform resolvers yup const schema yup.object name yup.string .required name is required .min 2 email yup.string .required email is required .email invalid email age yup.number .required .min 18 must be 18 function signupform const register handlesubmit formstate errors useform resolver yupresolver schema const onsubmit data console.log valid data return form onsubmit handlesubmit onsubmit input ...register name errors.name p errors.name.message p input ...register email errors.email p errors.email.message p input type number ...register age errors.age p errors.age.message p button type submit sign up button form react hook ",
    "courseIdx": 3,
    "modIdx": 6,
    "lesIdx": 1
  },
  {
    "title": "Multi-Step Forms",
    "module": "Forms & Validation",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r8 3 multi step forms r8 2 advanced 35 min multi step architecture each step is a component. parent manages current step and all form data. steps validate independently. state preservation form data stays in parent state across steps. going back shows previously entered data. progress indicators show which step user is on. visual progress bar or numbered steps. async validation check username availability or verify email via api before allowing next step. function multistepform const step setstep react.usestate 1 const data setdata react.usestate name email address city cardnumber const updatedata fields setdata ...data ...fields const next setstep s math.min s 1 4 const prev setstep s math.max s 1 1 return div progressbar current step total 4 step 1 personalinfo data data update updatedata onnext next step 2 shippinginfo data data update updatedata onnext next onprev prev step 3 paymentinfo data data update updatedata onnext next onprev prev step 4 reviewstep data data onprev prev onsubmit alert done div multi step form with progress bar back next navigation and data preserved across steps. build step navigation with progress bar preserve data across steps validate each step befor",
    "courseIdx": 3,
    "modIdx": 6,
    "lesIdx": 2
  },
  {
    "title": "Component Composition",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 1 component composition r2 7 beginner 35 min composition vs inheritance react favors composing components over extending classes. build complex uis by combining simple pieces — like lego bricks. component hierarchy components contain other components creating layers. card wraps cardheader cardbody. page wraps header sidebar main. single responsibility each component does one thing well. card handles the container. cardheader handles the header. if a component does too much split it. reusability small focused components are flexible. the same card system works for user profiles products blog posts settings pages — anything. wrapper components components whose job is to wrap content with consistent styling borders shadows. they don t care what goes inside. layered architecture think in layers — layout page sections sidebar main widgets statcard usercard atoms button badge . build a card system from small pieces function cardheader title return div style background 667eea color white padding 20px borderradius 12px 12px 0 0 h3 style margin 0 title h3 div function cardbody children return div style padding 20px children div function card children return div style border 2px solid e2",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 0
  },
  {
    "title": "The Children Prop",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 2 the children prop r19 1 beginner 30 min props.children special prop containing everything between a component s opening and closing tags. button click me button — click me is children. flexible wrappers components whose job is to wrap content. button wraps any content panel wraps any form modal wraps any dialog. they don t know or care what s inside. children can be anything text jsx elements other components arrays even functions. this is what makes react truly composable. children vs explicit props use children when content is unknown varied wrapper components . use explicit props when you know the exact shape name age title . real world examples every ui library uses children. material ui s dialog bootstrap s card your own panel — all powered by children. function button children variant primary const colors primary 667eea danger e53e3e success 38a169 return button style background colors variant color white padding 12px 24px border none borderradius 8px cursor pointer children button put anything inside button click me button button variant danger 🗑️ delete button button variant success span ✓ span save changes button panel wrapper — wraps any content function panel titl",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 1
  },
  {
    "title": "Lifting State Up",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 3 lifting state up r19 2 intermediate 40 min the sibling problem two sibling components can t talk directly. display and controls are both children of app — they need app to coordinate. lifting state move state from a child to the lowest common parent. both siblings then access the same data through props. single source of truth state lives in one place. multiple components read from it via props. no duplicate state no sync issues. data down events up parent passes data down via props. children send events up via callback functions. this is react s one way data flow. when not to lift if only one component uses the state keep it local. don t over lift — unnecessary prop passing creates its own problems. problem display and controls need to share count solution lift state to their parent counter function displaycount count return h1 style fontsize 4em textalign center count h1 function controlbuttons count onincrement ondecrement onreset return div style textalign center button onclick ondecrement disabled count 0 decrease button button onclick onreset reset button button onclick onincrement increase button div function counter state lives here — the common parent const count set",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 2
  },
  {
    "title": "Prop Drilling Problem",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 4 prop drilling problem r19 3 intermediate 35 min prop drilling passing props through many intermediate components that don t use them. app → layout → header → nav → usermenu. layout and header are just passing through. why it s a problem middle components become coupled to data they don t care about. change the prop shape and 5 components need updating. composition as a solution instead of passing through middle components compose the tree so data goes directly from source to consumer using children. when drilling is fine for 2 3 levels prop drilling is simpler than alternatives. don t over engineer shallow hierarchies. 🚫 problem user drills through 4 components function app const user react.usestate name jenna avatar 👩‍💻 return layout user user passes through function layout user return header user user just passing function header user return nav user user still passing function nav user return span user.avatar user.name span finally used ✅ fixed with composition function app const user react.usestate name jenna avatar 👩‍💻 return layout header nav span user.avatar user.name span nav header layout layout header nav use children — they don t need user at all with composit",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 3
  },
  {
    "title": "Component Patterns",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 5 component patterns r19 4 intermediate 45 min container presentational split into logic container and ui presentational . containers handle data and state. presentational components just render from props — pure reusable testable. compound components multiple components that work together as a unit sharing implicit state. like html select option — they only make sense together. controlled vs uncontrolled controlled parent manages state value onchange . uncontrolled component manages its own state defaultvalue ref . trade off control vs simplicity. when to use each container presentational for data heavy screens. compound for related component groups accordion tabs . controlled for forms. pattern 1 container presentational container handles logic and data function userlistcontainer const users setusers react.usestate const loading setloading react.usestate true react.useeffect settimeout setusers id 1 name sarah role developer id 2 name alex role designer setloading false 1000 if loading return p loading... p return userlistview users users presentational pure ui no logic function userlistview users return ul users.map user li key user.id strong user.name strong — user.role li ",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 4
  },
  {
    "title": "Component Lifecycle with useEffect",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 6 component lifecycle with useeffect r19 5 intermediate 50 min mount when component first appears in dom. useeffect with runs once here. use for initial data fetch start timers add event listeners. update when state or props change. useeffect with dep1 dep2 runs when those values change. use for re fetch when id changes sync title. unmount when component is removed from dom. the cleanup function return runs here. use for clear timers remove listeners cancel requests. dependency array mount only. x y when x or y change. no array every render usually a mistake . this is the 1 source of useeffect bugs. multiple effects use separate useeffect calls for separate concerns. don t put timer fetch title update in one effect. lifecycle in action mount → render → useeffect → update → re render → cleanup function liveclock const time settime react.usestate new date react.useeffect console.log ⏰ timer started mount const timer setinterval settime new date 1000 return console.log 🛑 timer stopped unmount clearinterval timer prevent memory leak mount only return p style fontsize 2em time.tolocaletimestring p dependency array function counter const count setcount react.usestate 0 runs when cou",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 5
  },
  {
    "title": "Project 1: Real-Time Chat Interface",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 7 project 1 real time chat interface r19 6 intermediate 150 min guided project using all module 2 patterns composition children lifting state container presentational lifecycle. architecture chatapp container — all state → userlist chatwindow. chatwindow uses children for messagelist typingindicator messageinput. chatapp is the only component with state. all others are presentational — they receive data and callbacks via props. mock websocket with setinterval for incoming messages. real async patterns with loading states. architecture chatapp container — all state lives here ├── userlist presentational │ └── userlistitem └── chatwindow children wrapper ├── messagelist │ └── message compound avatar content time ├── typingindicator └── messageinput function chatapp const messages setmessages react.usestate initial_messages const users react.usestate users const typinguser settypinguser react.usestate null const sendmessage text setmessages prev ...prev id date.now user you text time new date .tolocaletimestring return div classname chat app userlist users users chatwindow messagelist messages messages typinguser typingindicator user typinguser messageinput onsend sendmessage chat",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 6
  },
  {
    "title": "Project 2: Blog Platform",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 8 project 2 blog platform r19 7 intermediate 180 min independent project — no starter code. design the architecture yourself. full blog with postlist postcard postdetail commentsection comment compound authorcard categoryfilter searchbar relatedposts. must demonstrate container presentational separation proper state lifting composition children usage lifecycle effects for data. nested comments comment component renders itself recursively for replies. this is advanced composition. your architecture should look like blogapp container — owns all state ├── searchbar controlled input ├── categoryfilter filter buttons ├── postlist │ └── postcard click to view ├── postdetail │ ├── authorcard │ ├── post content │ └── commentsection │ └── comment compound header body actions └── relatedposts data structure const post id 1 title getting started with react content full post content... excerpt short preview... author name jenna avatar 👩‍💻 category react tags react beginner likes 42 comments createdat date.now a complete blog platform with posts comments filtering search sorting — built with professional component architecture. plan your component tree on paper first build all components ",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 7
  },
  {
    "title": "Module 2 Completion & Next Steps",
    "module": "Component Design Patterns",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r19 9 module 2 completion next steps r19 8 beginner 25 min skills mastered composition children prop state lifting prop drilling solutions container presentational compound components useeffect lifecycle. you built ~40 50 components across 2 projects using professional patterns. before module 2 i can make a button change text. after module 2 i can architect a professional application. these patterns are used at every react company. 85% of students report using them in job interviews. your module 2 progression lesson 13 components can contain other components lesson 14 children makes wrappers infinite flexible lesson 15 siblings share state through parents lesson 16 drilling is solvable with composition lesson 17 container presentational separates concerns lesson 18 useeffect manages the full lifecycle lesson 19 chat interface — 9 professional components lesson 20 blog platform — full architecture from scratch patterns mastered ✓ composition over inheritance ✓ container presentational ✓ compound components ✓ children as props ✓ state lifting ✓ prop drilling solutions ✓ useeffect lifecycle next module 3 — side effects data fetching you can now work on production codebases. next up ad",
    "courseIdx": 3,
    "modIdx": 7,
    "lesIdx": 8
  },
  {
    "title": "Testing Basics — Jest & RTL",
    "module": "Testing React Applications",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r20 1 testing basics — jest rtl r8 3 intermediate 35 min react testing library philosophy test what users see and do not implementation details. query by text role label — not by class or id. rendering render component puts your component in a virtual dom. screen.getbytext hello finds elements. events fireevent.click button or userevent.click button simulates user interaction. check state changes via dom updates. assertions expect element .tobeinthedocument tohavetextcontent tobedisabled tohavebeencalled . import render screen fireevent from @testing library react function counter const count setcount react.usestate 0 return div p count count p button onclick setcount c c 1 increment button button onclick setcount 0 disabled count 0 reset button div tests test renders with initial count of 0 render counter expect screen.getbytext count 0 .tobeinthedocument test increments when clicked render counter fireevent.click screen.getbytext increment expect screen.getbytext count 1 .tobeinthedocument test reset disabled when count is 0 render counter expect screen.getbytext reset .tobedisabled 3 tests passing renders correctly increments on click reset disabled at 0. write your first compon",
    "courseIdx": 3,
    "modIdx": 8,
    "lesIdx": 0
  },
  {
    "title": "Testing Async & API Calls",
    "module": "Testing React Applications",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r20 2 testing async api calls r20 1 advanced 40 min testing async use findby queries they wait or waitfor expect ... . don t use getby for async content — it doesn t wait. mocking fetch jest.fn creates mock functions. mock fetch to return test data without real api calls. loading error states verify loading indicator appears then data shows after resolve or error shows after reject. act warnings react needs effects to complete inside act . usually handled by rtl but async operations may need explicit wrapping. mock fetch global.fetch jest.fn function userprofile userid const user setuser react.usestate null const loading setloading react.usestate true react.useeffect fetch api users $ userid .then r r.json .then data setuser data setloading false userid if loading return p loading... p return h1 user.name h1 test shows loading then user data async fetch.mockresolvedvalue json promise.resolve name jenna render userprofile userid 1 expect screen.getbytext loading... .tobeinthedocument const heading await screen.findbytext jenna expect heading .tobeinthedocument test verifies loading state appears then user data shows after the mock api resolves. mock fetch with jest.fn test loading s",
    "courseIdx": 3,
    "modIdx": 8,
    "lesIdx": 1
  },
  {
    "title": "Testing Hooks, Context & Integration",
    "module": "Testing React Applications",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r20 3 testing hooks context integration r20 2 advanced 40 min testing custom hooks renderhook usemyhook from @testing library react hooks. test the hook in isolation. testing context wrap component in provider with test values. create a helper wrapper function. integration tests test multiple components working together. user adds item to cart → cart count updates → total recalculates. code coverage jest coverage shows which lines are tested. aim for 80% on critical paths. testing with context function renderwithcart ui initialitems return render cartprovider initialitems initialitems ui cartprovider test add to cart updates count renderwithcart productlist const addbutton screen.getbytext add to cart fireevent.click addbutton expect screen.getbytext cart 1 .tobeinthedocument test full checkout flow async renderwithcart app add product fireevent.click screen.getbytext add to cart go to cart fireevent.click screen.getbytext cart 1 verify total expect screen.getbytext total $29.99 .tobeinthedocument checkout fireevent.click screen.getbytext checkout verify redirect expect await screen.findbytext shipping info .tobeinthedocument integration test covering the full user flow add to cart",
    "courseIdx": 3,
    "modIdx": 8,
    "lesIdx": 2
  },
  {
    "title": "Vite & Modern Build Tools",
    "module": "Build Tools & Deployment",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r23 1 vite modern build tools r20 3 intermediate 40 min vite modern build tool. dev server with instant hmr hot module replacement . production builds with rollup. vite.config.js path aliases @ components environment variables .env manual chunks for code splitting plugins. environment variables .env.development for dev .env.production for prod. access via import.meta.env.vite_api_url. prefix with vite_ to expose to client. build output npm run build creates dist folder. hashed filenames for cache busting. tree shaking removes unused code. vite.config.js import defineconfig from vite import react from @vitejs plugin react import path from path export default defineconfig plugins react resolve alias @ path.resolve __dirname . src build rollupoptions output manualchunks vendor react react react dom vendor router react router dom .env.production vite_api_url https api.myapp.com vite_app_version 2.0.0 usage in code const apiurl import.meta.env.vite_api_url optimized build with vendor code splitting path aliases and environment specific config. create a vite react project from scratch configure path aliases for cleaner imports set up .env files for dev prod configure manual chunks for ve",
    "courseIdx": 3,
    "modIdx": 9,
    "lesIdx": 0
  },
  {
    "title": "Production Optimization",
    "module": "Build Tools & Deployment",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r23 2 production optimization r23 1 advanced 45 min code splitting react.lazy for every route. users only download code for pages they visit. image optimization webp format lazy loading loading lazy responsive srcset cdn hosting. pwa progressive web app. service worker for offline manifest.json for installability cache strategies. web vitals lcp largest contentful paint fid first input delay cls cumulative layout shift . lighthouse measures all 3. production checklist 1. code split all routes const home react.lazy import . pages home const about react.lazy import . pages about 2. optimize images img src photo.webp loading lazy width 400 height 300 alt ... 3. pwa manifest.json name my app short_name app start_url display standalone theme_color 667eea 4. service worker registration if serviceworker in navigator navigator.serviceworker.register sw.js 5. lighthouse audit npm run build npx serve dist production ready app code split images optimized pwa enabled lighthouse 90 . code split all routes with react.lazy convert images to webp and add lazy loading create manifest.json for pwa run lighthouse audit and fix issues achieve 90 on all lighthouse metrics lighthouse 90 start with a slo",
    "courseIdx": 3,
    "modIdx": 9,
    "lesIdx": 1
  },
  {
    "title": "Deployment & CI/CD",
    "module": "Build Tools & Deployment",
    "course": "React",
    "icon": "⚛️",
    "keywords": "r23 3 deployment ci cd r23 2 advanced 50 min static hosting vercel netlify github pages. npm run build → upload dist folder. auto deploy from github. environment variables set in hosting dashboard not in code . different values for staging vs production. ci cd github actions runs tests → builds → deploys automatically on every push. no manual deployment. preview deployments every pr gets its own url for testing before merging to production. .github workflows deploy.yml name deploy on push branches main jobs deploy runs on ubuntu latest steps uses actions checkout@v4 uses actions setup node@v4 with node version 20 run npm ci run npm test coverage run npm run build deploy to netlify vercel via their cli or github integration push to main → tests run → build → deploy. fully automated. no manual steps. deploy to netlify drag and drop then auto deploy configure environment variables in hosting dashboard set up github actions for ci cd create preview deployments for prs add custom domain and https full deployment pipeline deploy to netlify vercel custom domain https github actions ci cd run tests before deploy preview deploys for prs. i deployed by ftp ing files to a server manually. one",
    "courseIdx": 3,
    "modIdx": 9,
    "lesIdx": 2
  }
]
);
