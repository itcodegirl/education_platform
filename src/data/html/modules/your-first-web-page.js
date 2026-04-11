export const module = {
  id: 21,
  emoji: '🌟',
  title: 'Your First Web Page',
  tagline: 'From zero to a real website in your browser.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'lesson-01',
      title: 'Make Your Name Appear in a Browser',
      prereqs: [],
      difficulty: 'beginner',
      duration: '15 min',
      metadata: { estimatedTime: 15, difficulty: 'beginner', conceptsCount: 3, tasksCount: 3 },
      hook: {
        accomplishments: [
          'Create your first HTML file',
          'Make text appear in a web browser',
          'See your name displayed as a big heading',
        ],
      },
      do: {
        title: 'Create your first web page',
        steps: [
          'Open VS Code (or download it free from code.visualstudio.com if you don\'t have it)',
          'Click File → New File',
          'Click File → Save As',
          'Name it exactly: my-first-page.html',
          'Save it to your Desktop (so you can find it easily)',
        ],
        code: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Web Page</title>\n</head>\n<body>\n    <h1>Hello! I\'m [YOUR NAME]</h1>\n    <p>I just created my first web page!</p>\n</body>\n</html>',
        result: 'You just created a working web page with HTML!',
        proofRequired: 'your web page in the browser with YOUR name displayed',
      },
      understand: {
        concepts: [
          {
            name: 'HTML (HyperText Markup Language)',
            definition: 'This is the language that creates web pages. Every website you\'ve ever visited uses HTML.',
            analogy: 'The skeleton of a house. HTML provides the structure - the walls, floors, and rooms. Later you\'ll add paint (CSS) and electricity (JavaScript).',
          },
          {
            name: 'Tags: The building blocks',
            definition: 'Tags are words inside angle brackets like <h1> and </h1>. They work in pairs: opening tag <h1>, closing tag </h1>, and content between them.',
            analogy: 'Bookends. The opening tag and closing tag hold the content between them.',
          },
          {
            name: 'The basic structure',
            definition: 'Every HTML page has the same skeleton: DOCTYPE, html, head (with title), and body (with visible content).',
            analogy: 'Like the foundation, frame, and rooms of a house - every house needs these basic parts.',
          },
        ],
        keyTakeaway: 'HTML uses tags in pairs to wrap content. The browser reads these tags and displays your content as a web page.',
      },
      build: {
        goal: 'Tell people more about yourself by adding more paragraphs',
        codeComparison: {
          old: '<body>\n    <h1>Hello! I\'m [YOUR NAME]</h1>\n    <p>I just created my first web page!</p>\n</body>',
          new: '<body>\n    <h1>Hello! I\'m [YOUR NAME]</h1>\n    <p>I just created my first web page!</p>\n    \n    <p>I\'m learning to code because [YOUR REASON].</p>\n    <p>My favorite thing to do is [YOUR HOBBY].</p>\n    <p>I live in [YOUR CITY].</p>\n</body>',
        },
        hint: 'Each <p> tag creates a new paragraph with space between them. You can add as many as you want!',
      },
      challenge: {
        title: 'Create an About Me Page',
        mission: 'Build a complete About Me page with multiple sections using headings and paragraphs.',
        requirements: [
          'Main heading with your name (h1)',
          'At least 3 section headings (h2)',
          'At least 6 paragraphs of content',
          'Sections could include: About Me, My Goals, My Interests, Why I\'m Here',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>About [Your Name]</title>\n</head>\n<body>\n    <h1>Your Name</h1>\n    \n    <h2>First Section</h2>\n    <p>Content...</p>\n    \n    <h2>Second Section</h2>\n    <p>Content...</p>\n</body>\n</html>',
        bonusChallenge: 'Add an h2 section called \'My Coding Journey\' and write about what you\'ve learned so far (even if it\'s just this lesson!)',
      },
      summary: {
        capabilities: [
          'Create HTML files that open in a browser',
          'Use headings (h1, h2) to organize content',
          'Write paragraphs (p) with text',
          'Understand how opening and closing tags work',
          'Save and refresh to see your changes',
        ],
      },
      bridge: {
        preview: 'In Lesson 2, you\'ll add links that let people click to other pages. You\'ll connect multiple pages together and create your first multi-page website.',
        nextLessonId: 'lesson-02',
      },
    },
    {
      id: 'lesson-02',
      title: 'Connect Pages with Links',
      prereqs: ['lesson-01'],
      difficulty: 'beginner',
      duration: '18 min',
      metadata: { estimatedTime: 18, difficulty: 'beginner', conceptsCount: 4, tasksCount: 4 },
      hook: {
        accomplishments: [
          'Make text clickable so it goes to another page',
          'Create a second HTML page',
          'Connect your pages together with links',
          'Build a simple two-page website',
        ],
      },
      do: {
        title: 'Add a link to another website',
        steps: [
          'Open your my-first-page.html file in VS Code',
          'Find one of your <p> paragraphs',
          'Add this new paragraph at the end of your <body>, right before </body>',
          'Save the file',
          'Refresh your browser and click the link!',
        ],
        code: '<p>Want to learn more about coding? Visit <a href="https://www.freecodecamp.org">FreeCodeCamp</a> for free tutorials.</p>',
        result: 'You\'ll see blue underlined text that you can click. When clicked, it opens FreeCodeCamp in the same browser tab.',
        proofRequired: 'your web page with the clickable link (the link should be blue and underlined)',
      },
      understand: {
        concepts: [
          {
            name: 'The <a> tag (anchor tag)',
            definition: 'This creates clickable links - the foundation of the World Wide Web. \'a\' stands for \'anchor\' because links anchor different pages together.',
            analogy: 'A portal door. It takes you from one place to another when you step through it (click it).',
          },
          {
            name: 'The href attribute',
            definition: 'href is an attribute - extra information you add inside an opening tag. It tells the link where to go.',
            analogy: 'An address on an envelope. The <a> tag is the envelope, the href is where it\'s going, and the text is the letter inside.',
          },
          {
            name: 'External vs Internal links',
            definition: 'External links go to another website (https://...). Internal links go to another page on YOUR site (about.html).',
            analogy: 'Like the difference between driving to another city (external) vs. walking to another room in your house (internal).',
          },
          {
            name: 'The anatomy of a link',
            definition: 'A link has three parts: opening tag with href, the clickable text people see, and closing tag.',
            analogy: 'Like a door: the frame (opening tag), the handle you grab (text), and the other side of the frame (closing tag).',
          },
        ],
        keyTakeaway: 'The <a> tag makes text clickable. The href attribute tells it where to go.',
      },
      build: {
        goal: 'Create a second page and link between your two pages',
        codeComparison: {
          old: '<!-- In my-first-page.html -->\n<body>\n    <h1>Hello! I\'m [YOUR NAME]</h1>\n    <p>Content...</p>\n</body>',
          new: '<!-- In my-first-page.html -->\n<body>\n    <h1>Hello! I\'m [YOUR NAME]</h1>\n    <p>Content...</p>\n    <p><a href="my-hobbies.html">Click here to see my hobbies</a></p>\n</body>\n\n<!-- Create new file: my-hobbies.html -->\n<!DOCTYPE html>\n<html>\n<head>\n    <title>My Hobbies</title>\n</head>\n<body>\n    <h1>Things I Love to Do</h1>\n    <p>Content about your hobbies...</p>\n    <p><a href="my-first-page.html">Back to my main page</a></p>\n</body>\n</html>',
        },
        hint: 'The filename in href="my-hobbies.html" must EXACTLY match the actual filename. Check for typos!',
      },
      challenge: {
        title: 'Build a 3-Page Personal Website',
        mission: 'Create a small website with 3 connected pages and a navigation system.',
        requirements: [
          '3 HTML pages total: index.html (home), about.html (about you), interests.html (hobbies)',
          'Each page has links to the other two pages at the top AND bottom',
          'Each page has at least one external link (to a website related to your interests)',
          'External links open in new tabs (target="_blank")',
          'Internal links open in the same tab',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Personal Website</title>\n</head>\n<body>\n    <h1>Welcome to My Website</h1>\n    \n    <!-- Navigation links -->\n    <p>\n        <a href="about.html">About Me</a> | \n        <a href="interests.html">My Interests</a>\n    </p>\n    \n    <h2>Hello!</h2>\n    <p>Welcome to my corner of the internet...</p>\n    \n    <!-- Navigation at bottom too -->\n    <p>\n        <a href="about.html">About Me</a> | \n        <a href="interests.html">My Interests</a>\n    </p>\n</body>\n</html>',
        bonusChallenge: 'Add a 4th page called contact.html with your email, social media links, or other ways to reach you',
      },
      summary: {
        capabilities: [
          'Create clickable links with the <a> tag',
          'Use the href attribute to specify where links go',
          'Link to external websites',
          'Connect multiple HTML pages together',
          'Make links open in new tabs with target="_blank"',
          'Build a multi-page website with navigation',
        ],
      },
      bridge: {
        preview: 'In Lesson 3, you\'ll add images to your pages. You\'ll learn how to display photos, control their size, and make images clickable.',
        nextLessonId: 'lesson-03',
      },
    },
    {
      id: 'lesson-03',
      title: 'Add Images to Your Pages',
      prereqs: ['lesson-02'],
      difficulty: 'beginner',
      duration: '20 min',
      metadata: { estimatedTime: 20, difficulty: 'beginner', conceptsCount: 5, tasksCount: 4 },
      hook: {
        accomplishments: [
          'Display an image on your web page',
          'Control the size of images',
          'Add descriptive text for accessibility',
          'Make images clickable links',
        ],
      },
      do: {
        title: 'Add your first image',
        steps: [
          'Find a photo you want to use (or use this practice image: https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400)',
          'Open your index.html (or my-first-page.html) in VS Code',
          'Add the code below somewhere in your <body>',
          'Save and refresh your browser',
        ],
        code: '<img src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400" alt="A laptop on a desk with code on the screen">',
        result: 'You\'ll see an image appear on your page!',
        proofRequired: 'your web page with the image visible',
      },
      understand: {
        concepts: [
          {
            name: 'The <img> tag',
            definition: 'This displays images on your web page. It\'s a self-closing tag - no closing </img> needed. It just says \'put an image here.\'',
            analogy: 'A picture frame that goes on the wall. You don\'t open and close a picture frame - you just hang it up.',
          },
          {
            name: 'The src attribute (source)',
            definition: 'Tells the browser WHERE to find the image. Can be a URL (https://...) or a filename (my-photo.jpg) if the image is in the same folder.',
            analogy: 'Like an address telling the delivery person where to pick up a package.',
          },
          {
            name: 'The alt attribute (alternative text)',
            definition: 'Describes what the image shows. Used by screen readers for blind users, shows if image fails to load, helps search engines.',
            analogy: 'Audio description at a museum - tells people who can\'t see the art what it depicts.',
          },
          {
            name: 'Image paths',
            definition: 'Same folder: src=\'photo.jpg\'. Inside folder: src=\'images/photo.jpg\'. From URL: src=\'https://site.com/image.jpg\'',
            analogy: 'Giving directions: \'right here\' vs \'in the kitchen\' vs \'at 123 Main Street.\'',
          },
          {
            name: 'Width and height attributes',
            definition: 'Control image size in pixels. Usually set only width - height scales automatically to keep proportions.',
            analogy: 'Like telling a printer: make this photo 4 inches wide (height adjusts to match).',
          },
        ],
        keyTakeaway: '<img> needs both src (where) and alt (what). No closing tag needed.',
      },
      build: {
        goal: 'Make your image a reasonable size instead of HUGE',
        codeComparison: {
          old: '<img src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400" alt="A laptop on a desk">',
          new: '<img src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400" alt="A laptop on a desk" width="300">\n\n<!-- Try different sizes -->\n<img src="..." alt="..." width="150">  <!-- thumbnail -->\n<img src="..." alt="..." width="500">  <!-- large -->\n<img src="..." alt="..." width="100%"> <!-- full width -->',
        },
        hint: 'You can use height instead of width, but usually set only ONE. The browser automatically scales the other to keep proportions.',
      },
      challenge: {
        title: 'Build a Photo Gallery Page',
        mission: 'Create a new page that displays a gallery of images with captions and links.',
        requirements: [
          'Create a new file called gallery.html',
          'Add at least 4 images (mix of URLs and local files)',
          'Each image has a descriptive alt text',
          'Each image is a reasonable size (width between 200-400)',
          'Add a heading above each image describing what it shows',
          'Make at least 2 images clickable (linking to related pages or websites)',
          'Add navigation links to connect this page to your other pages',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Photo Gallery</title>\n</head>\n<body>\n    <h1>My Photo Gallery</h1>\n    \n    <p><a href="index.html">Back to Home</a></p>\n    \n    <h2>[First Image Title]</h2>\n    <img src="[IMAGE SOURCE]" alt="[DESCRIPTION]" width="300">\n    <p>[Caption explaining the image]</p>\n    \n    <!-- Add more images here -->\n    \n</body>\n</html>',
        bonusChallenge: 'Make one of your images clickable and link it to a full-size version that opens in a new tab',
      },
      summary: {
        capabilities: [
          'Display images with the <img> tag',
          'Use the src attribute to specify image location',
          'Add alt text for accessibility',
          'Control image size with width attribute',
          'Use images from URLs and local files',
          'Make images clickable by wrapping in <a> tags',
          'Understand image file paths',
        ],
      },
      bridge: {
        preview: 'In Lesson 4, you\'ll organize information with lists - bullet points for your hobbies, numbered steps for instructions, and navigation menus.',
        nextLessonId: 'lesson-04',
      },
    },
    {
      id: 'lesson-04',
      title: 'Organize Information with Lists',
      prereqs: ['lesson-03'],
      difficulty: 'beginner',
      duration: '16 min',
      metadata: { estimatedTime: 16, difficulty: 'beginner', conceptsCount: 3, tasksCount: 4 },
      hook: {
        accomplishments: [
          'Create bullet-point lists for your hobbies',
          'Make numbered step-by-step instructions',
          'Build a navigation menu with lists',
          'Nest lists inside other lists',
        ],
      },
      do: {
        title: 'Make a bullet-point list',
        steps: [
          'Open any HTML file (try index.html)',
          'Add this code in your <body>',
          'Replace these reasons with YOUR actual reasons',
          'Save and refresh',
        ],
        code: '<h2>Why I\'m Learning to Code</h2>\n<ul>\n    <li>I want to build my own projects</li>\n    <li>I\'m tired of paying for simple websites</li>\n    <li>I want a career change</li>\n    <li>I love solving puzzles</li>\n</ul>',
        result: 'You\'ll see bullet points (\u2022) next to each reason!',
        proofRequired: 'your bulleted list with YOUR reasons',
      },
      understand: {
        concepts: [
          {
            name: 'The <ul> tag (unordered list)',
            definition: 'Creates bullet-point lists. \'Unordered\' means the sequence doesn\'t matter \u2014 you could rearrange items and the meaning stays the same.',
            analogy: 'A grocery list. Order doesn\'t matter \u2014 you could buy milk before eggs or eggs before milk.',
          },
          {
            name: 'The <ol> tag (ordered list)',
            definition: 'Creates numbered lists. \'Ordered\' means sequence MATTERS \u2014 step 1 must come before step 2.',
            analogy: 'A recipe. You can\'t frost a cake before baking it \u2014 order matters!',
          },
          {
            name: 'The <li> tag (list item)',
            definition: 'Each <li> represents ONE item in the list. Works inside both <ul> and <ol>.',
            analogy: 'Individual items on your shopping list or steps in your recipe.',
          },
        ],
        keyTakeaway: '<ul> + <li> = bullet-point list for items in any order. <ol> + <li> = numbered list for sequential steps.',
      },
      build: {
        goal: 'Create step-by-step instructions using numbers instead of bullets',
        codeComparison: {
          old: '<ul>\n    <li>Item one</li>\n    <li>Item two</li>\n</ul>',
          new: '<h2>How to Make Coffee (My Way)</h2>\n<ol>\n    <li>Grind fresh coffee beans</li>\n    <li>Boil water to 200\u00B0F</li>\n    <li>Pour water over grounds</li>\n    <li>Wait 4 minutes</li>\n    <li>Press plunger slowly</li>\n    <li>Pour and enjoy!</li>\n</ol>',
        },
        hint: 'The browser automatically numbers your steps: 1, 2, 3, 4... You don\'t have to type the numbers!',
      },
      challenge: {
        title: 'Build a Skills & Resources Page',
        mission: 'Create a page that lists your current skills, learning goals, and helpful resources \u2014 organized with multiple list types.',
        requirements: [
          'Create skills.html',
          'Use <ul> for your current skills (3+ items)',
          'Use <ol> for your learning roadmap (5+ steps in order)',
          'Use nested lists for at least one section',
          'Add a resources section with links to helpful sites',
          'Include <nav> with list-based navigation',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Skills & Goals</title>\n</head>\n<body>\n    <h1>My Development Journey</h1>\n    \n    <nav>\n        <ul>\n            <li><a href="index.html">Home</a></li>\n            <!-- Add more nav links -->\n        </ul>\n    </nav>\n    \n    <h2>Skills I\'m Building</h2>\n    <ul>\n        <li><!-- Your skill --></li>\n    </ul>\n    \n    <h2>My Learning Roadmap</h2>\n    <ol>\n        <li><!-- Your step --></li>\n    </ol>\n</body>\n</html>',
        bonusChallenge: 'Add a \'Wins This Week\' section with an <ol> listing 3-5 coding accomplishments (even tiny ones count!)',
      },
      summary: {
        capabilities: [
          'Create bullet-point lists with <ul> and <li>',
          'Create numbered lists with <ol> and <li>',
          'Build navigation menus using list structure',
          'Nest lists inside other lists for sub-items',
          'Choose the right list type for your content',
          'Understand why lists matter for screen readers',
        ],
      },
      bridge: {
        preview: 'In Lesson 5, you\'ll build interactive forms \u2014 text inputs, dropdowns, checkboxes, and buttons that collect information from users.',
        nextLessonId: 'lesson-05',
      },
    },
    {
      id: 'lesson-05',
      title: 'Collect Information with Forms',
      prereqs: ['lesson-04'],
      difficulty: 'beginner',
      duration: '25 min',
      metadata: { estimatedTime: 25, difficulty: 'beginner', conceptsCount: 6, tasksCount: 5 },
      hook: {
        accomplishments: [
          'Create a text input where users can type',
          'Add a submit button',
          'Build dropdown menus with multiple choices',
          'Make checkboxes and radio buttons',
          'Build a complete contact form',
        ],
      },
      do: {
        title: 'Create your first text input',
        steps: [
          'Create a new file: contact.html',
          'Copy the code below',
          'Save and open in your browser',
          'Click in the input box and type your name',
        ],
        code: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Contact Me</title>\n</head>\n<body>\n    <h1>Get in Touch</h1>\n    \n    <form>\n        <label for="name">Your Name:</label>\n        <input type="text" id="name" name="name">\n    </form>\n</body>\n</html>',
        result: 'You\'ll see a text box where you can type! The label \'Your Name:\' sits next to it.',
        proofRequired: 'the input box with text typed inside it',
      },
      understand: {
        concepts: [
          {
            name: 'The <form> tag',
            definition: 'A container for all input elements. Think of it as a clipboard that holds all the fields you want someone to fill out.',
            analogy: 'A clipboard with a form. The <form> tag is the clipboard, labels are printed questions, inputs are blank lines to write on.',
          },
          {
            name: 'The <label> tag',
            definition: 'Text that describes what the input is for. It\'s clickable \u2014 when you click the label, it focuses the input!',
            analogy: 'The question on a form that tells you what to write in each blank.',
          },
          {
            name: 'The <input> tag',
            definition: 'Creates an input field. It\'s self-closing (no </input> needed). The \'type\' attribute changes what kind of input it is.',
            analogy: 'Different types of blanks on a form: short line for name, box for checkmark, circle for radio button.',
          },
          {
            name: 'The for/id connection',
            definition: 'The label\'s \'for\' attribute must match the input\'s \'id\' attribute. This connection is REQUIRED for accessibility.',
            analogy: 'Like matching question numbers on a test - question #1 goes with answer box #1.',
          },
          {
            name: 'Radio vs Checkbox',
            definition: 'Radio buttons: only one choice allowed (same \'name\'). Checkboxes: multiple choices allowed.',
            analogy: 'Radio = multiple choice test question. Checkbox = \'select all that apply\' question.',
          },
          {
            name: 'The <select> tag',
            definition: 'Creates a dropdown menu. Each <option> inside represents one choice in the menu.',
            analogy: 'Like a dropdown menu on a phone - tap it and options appear.',
          },
        ],
        keyTakeaway: 'Every input needs a label. Connect them with matching \'for\' and \'id\' attributes.',
      },
      build: {
        goal: 'Add an email field and a message box to your form',
        codeComparison: {
          old: '<form>\n    <label for="name">Your Name:</label>\n    <input type="text" id="name" name="name">\n</form>',
          new: '<form>\n    <label for="name">Your Name:</label>\n    <input type="text" id="name" name="name">\n    \n    <br><br>\n    \n    <label for="email">Your Email:</label>\n    <input type="email" id="email" name="email">\n    \n    <br><br>\n    \n    <label for="message">Your Message:</label>\n    <textarea id="message" name="message"></textarea>\n    \n    <br><br>\n    \n    <button type="submit">Send Message</button>\n</form>',
        },
        hint: 'The email input will validate that it looks like an email address when you submit!',
      },
      challenge: {
        title: 'Build a Complete Signup Form',
        mission: 'Create a realistic user registration form with validation.',
        requirements: [
          'Create signup.html',
          'Include: username, email, password fields',
          'Add a \'Confirm Password\' field',
          'Use a dropdown for \'How did you hear about us?\'',
          'Add checkboxes for \'I agree to Terms of Service\'',
          'Use the \'required\' attribute on at least 3 fields',
          'Add \'placeholder\' attributes to show example text',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Sign Up</title>\n</head>\n<body>\n    <h1>Create Your Account</h1>\n    \n    <form>\n        <label for="username">Username:</label>\n        <input type="text" id="username" name="username" required>\n        \n        <!-- Add more fields here -->\n        \n        <button type="submit">Create Account</button>\n    </form>\n</body>\n</html>',
        bonusChallenge: 'Add a \'Date of Birth\' field with type="date" and a phone number field with type="tel"',
      },
      summary: {
        capabilities: [
          'Create form containers with <form>',
          'Add text inputs with <input type="text">',
          'Validate emails with <input type="email">',
          'Create password fields with <input type="password">',
          'Build multi-line text areas with <textarea>',
          'Make radio buttons for single choices',
          'Add checkboxes for multiple choices',
          'Create dropdown menus with <select> and <option>',
          'Connect labels to inputs with \'for\' and \'id\'',
          'Make fields required with the \'required\' attribute',
        ],
      },
      bridge: {
        preview: 'In Lesson 6, you\'ll organize data into tables \u2014 rows, columns, headers, and structured information display.',
        nextLessonId: 'lesson-06',
      },
    },
    {
      id: 'lesson-06',
      title: 'Display Data in Tables',
      prereqs: ['lesson-05'],
      difficulty: 'beginner',
      duration: '18 min',
      metadata: { estimatedTime: 18, difficulty: 'beginner', conceptsCount: 4, tasksCount: 4 },
      hook: {
        accomplishments: [
          'Create a table with rows and columns',
          'Add headers that describe your data',
          'Display structured information clearly',
          'Build a pricing comparison table',
        ],
      },
      do: {
        title: 'Make your first table',
        steps: [
          'Create a new file: schedule.html',
          'Copy the code below',
          'Save and open in your browser',
        ],
        code: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Weekly Schedule</title>\n</head>\n<body>\n    <h1>My Learning Schedule</h1>\n    \n    <table border="1">\n        <tr>\n            <td>Monday</td>\n            <td>HTML practice</td>\n            <td>1 hour</td>\n        </tr>\n        <tr>\n            <td>Tuesday</td>\n            <td>Build project</td>\n            <td>2 hours</td>\n        </tr>\n        <tr>\n            <td>Wednesday</td>\n            <td>Watch tutorials</td>\n            <td>1 hour</td>\n        </tr>\n    </table>\n</body>\n</html>',
        result: 'You\'ll see a grid with 3 rows and 3 columns, with borders around each cell!',
        proofRequired: 'your table with borders and data',
      },
      understand: {
        concepts: [
          {
            name: 'The <table> tag',
            definition: 'Creates the container for your entire table. Everything else goes inside it.',
            analogy: 'The frame of a spreadsheet or Excel grid.',
          },
          {
            name: 'The <tr> tag (table row)',
            definition: 'Each <tr> is ONE row going across the table horizontally. Tables are built row-by-row.',
            analogy: 'Like horizontal lines on notebook paper - each line is a row.',
          },
          {
            name: 'The <td> tag (table data)',
            definition: 'Each <td> is ONE cell in the row. \'td\' stands for \'table data\' - it\'s where your actual content goes.',
            analogy: 'Individual boxes in the grid where you write information.',
          },
          {
            name: 'The <th> tag (table header)',
            definition: 'Like <td> but for headers. Browsers automatically make it bold and centered. Screen readers announce these as headers.',
            analogy: 'The column titles in a spreadsheet - the gray row at the top that labels what each column contains.',
          },
        ],
        keyTakeaway: 'Tables are built row-by-row. Each <tr> creates a new row. Each <td> inside that row creates a cell.',
      },
      build: {
        goal: 'Add table headers to make the first row stand out',
        codeComparison: {
          old: '<table border="1">\n    <tr>\n        <td>Monday</td>\n        <td>HTML practice</td>\n        <td>1 hour</td>\n    </tr>\n</table>',
          new: '<table border="1">\n    <tr>\n        <th>Day</th>\n        <th>Activity</th>\n        <th>Duration</th>\n    </tr>\n    <tr>\n        <td>Monday</td>\n        <td>HTML practice</td>\n        <td>1 hour</td>\n    </tr>\n    <tr>\n        <td>Tuesday</td>\n        <td>Build project</td>\n        <td>2 hours</td>\n    </tr>\n</table>',
        },
        hint: 'The first row is now bold and centered automatically because you used <th> instead of <td>',
      },
      challenge: {
        title: 'Build a Pricing Comparison Table',
        mission: 'Create a comparison table showing different plans, features, or options side-by-side.',
        requirements: [
          'Create comparison.html',
          'Use <thead> and <tbody>',
          'At least 3 columns comparing different options',
          'At least 5 rows showing different features/criteria',
          'Use <th> for both column headers AND row headers',
          'Add navigation linking back to your other pages',
        ],
        starterCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Learning Platform Comparison</title>\n</head>\n<body>\n    <h1>Where Should I Learn?</h1>\n    \n    <table border="1">\n        <thead>\n            <tr>\n                <th>Platform</th>\n                <th>Cost</th>\n                <th>Best For</th>\n                <th>My Rating</th>\n            </tr>\n        </thead>\n        <tbody>\n            <tr>\n                <td><!-- Platform name --></td>\n                <td><!-- Cost --></td>\n                <td><!-- What it\'s good for --></td>\n                <td><!-- Your rating --></td>\n            </tr>\n            <!-- Add more rows -->\n        </tbody>\n    </table>\n</body>\n</html>',
        bonusChallenge: 'Add a <tfoot> section at the bottom with a total or summary row',
      },
      summary: {
        capabilities: [
          'Create tables with <table>, <tr>, and <td>',
          'Add headers with <th> that are bold and centered',
          'Structure tables with <thead> and <tbody>',
          'Display data in rows and columns',
          'Build comparison and schedule tables',
          'Understand when tables are appropriate (data only!)',
        ],
      },
      bridge: {
        preview: 'In Lesson 7, you\'ll learn Semantic HTML \u2014 the difference between beginner code and professional code. You\'ll use tags like <header>, <nav>, <main>, <section>, <article>, and <footer>.',
        nextLessonId: 'lesson-07',
      },
    },
  ],
};
