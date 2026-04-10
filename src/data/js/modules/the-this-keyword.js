// The this Keyword
// Module 15 of 22

export const module215 = {
  id: 215,
  emoji: '👆',
  title: 'The this Keyword',
  tagline: 'Context changes everything.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j15-1',
      title: 'this in Different Contexts',
      difficulty: 'intermediate',
      duration: '12 min',
      prereqs: ['j14-2'],
      concepts: [
        'In the global scope, this refers to the window object.',
        'In a regular function, this depends on how the function is called.',
        'In an object method, this refers to the object itself.',
        'Arrow functions don\'t have their own this — they inherit from the parent scope.',
        'In event handlers, this refers to the element that triggered the event.'
      ],
      code: `// Object method: this = the object
const user = {
    name: "Jenna",
    greet() {
        console.log(\`Hi, I'm \${this.name}\`);
    }
};
user.greet(); // "Hi, I'm Jenna"

// Arrow vs regular in objects
const app = {
    name: "CodeHerWay",
    regular() {
        console.log(this.name); // "CodeHerWay"
    },
    arrow: () => {
        console.log(this.name); // undefined!
    }
};

// Event listener
// btn.addEventListener("click", function() {
//     console.log(this); // the button element
// });`,
      output: 'this refers to different things depending on context.',
      tasks: [
        'Create an object with a method that uses this.',
        'Compare this in a regular function vs arrow function inside an object.',
        'Log this inside an event listener.'
      ],
      challenge: 'Build an object with methods that correctly use this to access its own properties.',
      devFession: 'I used an arrow function as an object method and this was undefined. Arrow functions inherit this. They don\'t create their own.'
    }
  ]
};
