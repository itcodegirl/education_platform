// Functions
// Module 6 of 22

export const module206 = {
  id: 206,
  emoji: '🧩',
  title: 'Functions',
  tagline: 'Write once, use everywhere.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j6-1',
      title: 'Function Declarations & Expressions',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j5-1'],
      concepts: [
        'Functions are reusable blocks of code — the building blocks of every app.',
        'Declarations are hoisted — you can call them before they\'re defined.',
        'Expressions are NOT hoisted — must be defined before use.',
        'Parameters are the names in the definition. Arguments are the values you pass in.'
      ],
      code: `// Declaration (hoisted)
function greet(name) {
    return "Hello, " + name + "!";
}
console.log(greet("Jenna")); // "Hello, Jenna!"

// Expression (not hoisted)
const add = function(a, b) {
    return a + b;
};
console.log(add(2, 3)); // 5

// Default parameters
function welcome(name = "friend") {
    return \`Welcome, \${name}!\`;
}
console.log(welcome());       // "Welcome, friend!"
console.log(welcome("Alex")); // "Welcome, Alex!"`,
      output: 'Function calls with return values and default parameters.',
      tasks: [
        'Write a function declaration with 2 parameters.',
        'Write a function expression stored in a const.',
        'Use a default parameter.'
      ],
      challenge: 'Build a tip calculator function that takes bill and tip percentage.',
      devFession: 'I forgot the return keyword and my function gave me undefined. Functions don\'t automatically return things.'
    },
    {
      id: 'j6-2',
      title: 'Arrow Functions',
      difficulty: 'beginner',
      duration: '8 min',
      prereqs: ['j6-1'],
      concepts: [
        'Arrow functions are shorter syntax: const fn = (x) => x * 2.',
        'Single expression = implicit return (no braces needed).',
        'Multiple lines need braces and an explicit return.',
        'Arrow functions don\'t have their own "this" — important for callbacks.'
      ],
      code: `// Full arrow
const multiply = (a, b) => {
    return a * b;
};

// Single expression = implicit return
const double = (x) => x * 2;
const isAdult = (age) => age >= 18;

// With arrays
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);
const evens = nums.filter(n => n % 2 === 0);
console.log(doubled); // [2, 4, 6, 8, 10]
console.log(evens);   // [2, 4]`,
      output: 'Arrow functions used standalone and with array methods.',
      tasks: [
        'Convert a regular function to an arrow function.',
        'Write an arrow with implicit return.',
        'Use an arrow function inside .map() or .filter().'
      ],
      challenge: 'Rewrite 3 functions from previous lessons as arrow functions.',
      devFession: 'I put curly braces on a one-liner arrow and forgot return. No braces = implicit return. Braces = you need return.'
    },
    {
      id: 'j6-3',
      title: 'Closures & Callbacks',
      difficulty: 'beginner',
      duration: '12 min',
      prereqs: ['j6-2'],
      concepts: [
        'A closure is a function that remembers variables from its outer scope.',
        'Closures are created every time a function is defined inside another function.',
        'A callback is a function passed as an argument to another function.',
        'setTimeout, addEventListener, and array methods all use callbacks.',
        'Understanding closures and callbacks is essential for async JavaScript.'
      ],
      code: `// Closure: inner function remembers outer variable
function createCounter() {
    let count = 0;
    return function() {
        count++;
        return count;
    };
}
const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// Callback: function passed to another function
function doMath(a, b, operation) {
    return operation(a, b);
}
const result = doMath(5, 3, (a, b) => a + b);
console.log(result); // 8

// setTimeout callback
setTimeout(() => {
    console.log("Runs after 1 second");
}, 1000);`,
      output: 'A counter that increments via closure, and a callback-powered math function.',
      tasks: [
        'Create a closure that tracks a running total.',
        'Pass a function as a callback to another function.',
        'Use setTimeout with a callback.'
      ],
      challenge: 'Build a createGreeter closure that remembers a greeting style and reuses it.',
      devFession: 'Closures clicked for me on day 47. Before that, they were just words people said in interviews to sound smart.'
    }
  ]
};
