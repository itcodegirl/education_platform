// Variables & Data Types
// Module 2 of 22

export const module202 = {
  id: 202,
  emoji: '📦',
  title: 'Variables & Data Types',
  tagline: 'Store data. Name it. Use it.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j2-1',
      title: 'let, const, and var',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j1-3'],
      concepts: [
        'const can\'t be reassigned — use it by default.',
        'let can be reassigned — use when the value changes.',
        'var is the old way — has scoping bugs, avoid it.',
        'Naming: camelCase, start with letter/$/_. Be descriptive.'
      ],
      code: `const appName = "CodeHerWay";
const maxUsers = 100;

let score = 0;
score = 10;
score += 5; // 15

// const with objects: reference fixed, contents mutable
const colors = ["red", "blue"];
colors.push("green"); // OK!
// colors = [];        // ERROR!

const firstName = "Jenna";   // camelCase
const MAX_RETRIES = 3;       // UPPER_CASE for true constants`,
      output: 'Variables created with const and let, showing reassignment rules.',
      tasks: [
        'Create 3 const variables and 2 let variables.',
        'Try reassigning a const and read the error message.',
        'Push an item into a const array — explain why it works.'
      ],
      challenge: 'Build a mini scoreboard using let for score and const for player name.',
      devFession: 'I used var for everything and had a bug where a loop variable leaked into the outer scope. Let exists for a reason.'
    },
    {
      id: 'j2-2',
      title: 'Primitive Data Types',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j2-1'],
      concepts: [
        '7 primitives: string, number, boolean, undefined, null, symbol, bigint.',
        'string — text in quotes. Template literals use backticks for interpolation.',
        'number — integers AND decimals. No separate int/float types.',
        'boolean — true or false. Used in every if statement.',
        'undefined — declared but no value. null — intentionally empty.',
        'typeof checks what type a value is.'
      ],
      code: `const name = "Jenna";
const msg = \`Welcome, \${name}!\`;
const age = 25;
const price = 29.99;
const isLoggedIn = true;
let email;            // undefined
const deleted = null; // intentionally empty

console.log(typeof name);      // "string"
console.log(typeof age);       // "number"
console.log(typeof isLoggedIn); // "boolean"
console.log(typeof null);       // "object" (JS bug!)`,
      output: 'Different data types and their typeof results.',
      tasks: [
        'Create one variable of each primitive type.',
        'Use typeof on each and log the results.',
        'Create a template literal with variable interpolation.'
      ],
      challenge: 'Build a user profile object using all primitive types.',
      devFession: 'typeof null returns "object." It\'s a 28-year-old bug in JavaScript. They can\'t fix it without breaking the internet.'
    },
    {
      id: 'j2-3',
      title: 'Type Coercion & Truthy/Falsy',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j2-2'],
      concepts: [
        'JavaScript automatically converts types in some operations — this is coercion.',
        '"5" + 1 gives "51" (string) but "5" - 1 gives 4 (number).',
        'Falsy values: false, 0, "", null, undefined, NaN — everything else is truthy.',
        '=== checks value AND type (strict). == converts types first (loose).',
        'Always use === unless you have a specific reason not to.'
      ],
      code: `// Type coercion surprises
console.log("5" + 1);   // "51" (string concat)
console.log("5" - 1);   // 4 (number math)
console.log(true + 1);  // 2
console.log("" == false); // true (coercion!)
console.log("" === false); // false (strict)

// Falsy values
if (0) console.log("nope");        // skipped
if ("") console.log("nope");       // skipped
if (null) console.log("nope");     // skipped
if ("hello") console.log("truthy"); // runs!
if (42) console.log("truthy");     // runs!

// Explicit conversion
const str = String(42);     // "42"
const num = Number("42");   // 42
const bool = Boolean(1);    // true`,
      output: 'Coercion results, falsy checks, and explicit type conversion.',
      tasks: [
        'Predict the output of "5" + 1 and "5" - 1 before running.',
        'List all 6 falsy values from memory.',
        'Convert a string to a number and a number to a string.'
      ],
      challenge: 'Write a function that checks if a value is truthy or falsy and returns a descriptive string.',
      devFession: 'I used == instead of === and my code treated 0 and "" as the same thing. They are not.'
    }
  ]
};
