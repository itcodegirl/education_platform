// What JavaScript Is
// Module 1 of 22

export const module201 = {
  id: 201,
  emoji: '⚡',
  title: 'What JavaScript Is',
  tagline: 'Understand the language before you write it.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j1-1',
      title: 'What JavaScript Does',
      difficulty: 'beginner',
      duration: '8 min',
      prereqs: [],
      concepts: [
        'JavaScript is the programming language of the web.',
        'HTML builds structure, CSS adds style, JavaScript adds behavior.',
        'JS is imperative — step-by-step instructions, not descriptions.',
        'Every click, animation, form validation, and data fetch is JavaScript.'
      ],
      code: `console.log("Hello, World!");

let name = "CodeHerWay";
console.log("Welcome to " + name);

let hour = new Date().getHours();
if (hour < 12) {
    console.log("Good morning!");
} else {
    console.log("Good afternoon!");
}`,
      output: 'A greeting and a time-based message in the console.',
      tasks: [
        'Open DevTools Console (F12) and type a console.log().',
        'Create a variable and log it.',
        'Write an if/else that checks the current hour.'
      ],
      challenge: 'Make a script that greets the user differently based on morning, afternoon, or evening.',
      devFession: 'I tried to make a button work with just HTML. HTML looked at me and said, "That\'s not my job."'
    },
    {
      id: 'j1-2',
      title: 'How JavaScript Runs in the Browser',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j1-1'],
      concepts: [
        'The JS engine (V8 in Chrome) reads and executes your code.',
        'JavaScript is single-threaded — it does one thing at a time.',
        'The call stack tracks which function is currently running.',
        'The memory heap stores variables and objects.',
        'Understanding this helps you debug async issues later.'
      ],
      code: `// JavaScript runs top to bottom
console.log("First");
console.log("Second");
console.log("Third");

// Functions go on the call stack
function greet() {
    console.log("Hello!");
}
greet(); // pushed onto stack, runs, pops off`,
      output: 'First, Second, Third, Hello! — in that exact order.',
      tasks: [
        'Run 5 console.log statements and verify the order.',
        'Call a function and observe it runs when called, not when defined.',
        'Name the JS engine your browser uses.'
      ],
      challenge: 'Explain in your own words why JavaScript is called "single-threaded."',
      devFession: 'I thought JavaScript ran everything at once. It doesn\'t. It\'s one thing at a time, really fast.'
    },
    {
      id: 'j1-3',
      title: 'Adding JavaScript to HTML',
      difficulty: 'beginner',
      duration: '8 min',
      prereqs: ['j1-2'],
      concepts: [
        'External file with defer is the professional standard.',
        'Internal <script> tags work but don\'t scale well.',
        'Inline onclick handlers are messy — avoid them.',
        'defer ensures HTML loads before JS runs.'
      ],
      code: `<!-- Best: external with defer -->
<script src="app.js" defer></script>

<!-- OK: internal -->
<script>
    console.log("Runs immediately");
</script>

<!-- BAD: inline -->
<button onclick="alert('messy!')">Don't</button>`,
      output: 'Three ways to add JS — only the first is recommended.',
      tasks: [
        'Create an app.js file and link it with defer.',
        'Move any inline JS into the external file.',
        'Verify your script runs after the page loads.'
      ],
      challenge: 'Set up an HTML page with an external JS file that logs "Ready!" when loaded.',
      devFession: 'I put my script in the <head> without defer and wondered why it couldn\'t find any elements.'
    }
  ]
};
