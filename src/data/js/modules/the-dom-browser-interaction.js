// The DOM & Browser Interaction
// Module 9 of 22

export const module209 = {
  id: 209,
  emoji: '🖥️',
  title: 'The DOM & Browser Interaction',
  tagline: 'Where JavaScript meets the page.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j9-1',
      title: 'Selecting Elements',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j8-2'],
      concepts: [
        'document.querySelector() finds the FIRST matching element.',
        'document.querySelectorAll() finds ALL matching elements (NodeList).',
        'document.getElementById() finds by ID — older but still common.',
        'You can use any CSS selector: .class, #id, tag, [attribute].'
      ],
      code: `// Single element
const title = document.querySelector("h1");
const btn = document.querySelector(".btn");
const nav = document.getElementById("main-nav");

// Multiple elements
const items = document.querySelectorAll(".item");
items.forEach(item => {
    console.log(item.textContent);
});

// Complex selectors
const firstCard = document.querySelector(".cards > .card:first-child");`,
      output: 'Elements selected from the DOM using CSS selectors.',
      tasks: [
        'Select an element by class, ID, and tag name.',
        'Select all items with a class and loop through them.',
        'Use a complex CSS selector with querySelector.'
      ],
      challenge: 'Select a navigation menu, all its links, and log each link\'s text.',
      devFession: 'I tried selecting elements before the DOM loaded. Script in <head> without defer = elements don\'t exist yet.'
    },
    {
      id: 'j9-2',
      title: 'Event Listeners',
      difficulty: 'beginner',
      duration: '12 min',
      prereqs: ['j9-1'],
      concepts: [
        'addEventListener attaches behavior to elements.',
        'Common events: click, submit, input, keydown, mouseover, scroll.',
        'The event object (e) contains info about what happened.',
        'e.preventDefault() stops default behavior (like form submission).'
      ],
      code: `const btn = document.querySelector(".btn");

// Click event
btn.addEventListener("click", () => {
    console.log("Clicked!");
});

// Event object
btn.addEventListener("click", (e) => {
    console.log(e.target);     // the clicked element
    console.log(e.type);       // "click"
});

// Form submit
const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
    e.preventDefault(); // stop page reload
    const name = form.querySelector("#name").value;
    console.log("Submitted:", name);
});`,
      output: 'Click handlers, event object access, and form submission prevention.',
      tasks: [
        'Add a click event to a button.',
        'Log the event object and inspect its properties.',
        'Prevent a form from reloading the page on submit.'
      ],
      challenge: 'Build a button that counts how many times it\'s been clicked and displays the count.',
      devFession: 'I forgot preventDefault() on a form and the page reloaded every time. My data vanished into the void.'
    },
    {
      id: 'j9-3',
      title: 'DOM Manipulation',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j9-2'],
      concepts: [
        'textContent changes text. innerHTML changes HTML (use carefully).',
        'classList.add/remove/toggle manages CSS classes.',
        'setAttribute and style change attributes and inline styles.',
        'createElement + appendChild creates and adds new elements.'
      ],
      code: `const heading = document.querySelector("h1");
heading.textContent = "New Title";

// Toggle class
const card = document.querySelector(".card");
card.classList.toggle("active");
card.classList.add("highlight");

// Create element
const li = document.createElement("li");
li.textContent = "New item";
li.classList.add("list-item");
document.querySelector("ul").appendChild(li);

// Change styles
card.style.backgroundColor = "#ff6b9d";
card.style.padding = "20px";`,
      output: 'Text changed, classes toggled, elements created, and styles applied.',
      tasks: [
        'Change the text of a heading.',
        'Toggle a class on a button click.',
        'Create a new list item and append it to a list.'
      ],
      challenge: 'Build a dynamic list: user types in an input, clicks add, item appears in the list.',
      devFession: 'I used innerHTML to insert user input. Hello, XSS vulnerability. Use textContent for user data.'
    }
  ]
};
