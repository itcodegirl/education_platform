// Objects
// Module 8 of 22

export const module208 = {
  id: 208,
  emoji: '🏗️',
  title: 'Objects',
  tagline: 'Structured data for the real world.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j8-1',
      title: 'Objects, Properties & Methods',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j7-2'],
      concepts: [
        'Objects store key-value pairs — like a dictionary.',
        'Access with dot notation (obj.name) or brackets (obj["name"]).',
        'Objects can contain any type: strings, numbers, arrays, even other objects.',
        'Methods are functions stored as object properties.'
      ],
      code: `const user = {
    name: "Jenna",
    age: 25,
    skills: ["HTML", "CSS", "JS"],
    greet() {
        return \`Hi, I'm \${this.name}!\`;
    }
};

console.log(user.name);       // "Jenna"
console.log(user["age"]);     // 25
console.log(user.skills[0]);  // "HTML"
console.log(user.greet());    // "Hi, I'm Jenna!"`,
      output: 'Object access via dot/bracket notation and method calling.',
      tasks: [
        'Create an object with 4 properties of different types.',
        'Access properties using both dot and bracket notation.',
        'Add a method to your object.'
      ],
      challenge: 'Build a "user profile" object with name, email, skills array, and an introduce() method.',
      devFession: 'I tried to access user.first name (with a space). Bracket notation exists for exactly this: user["first name"].'
    },
    {
      id: 'j8-2',
      title: 'Destructuring & Spread',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j8-1'],
      concepts: [
        'Destructuring extracts values from objects/arrays into variables.',
        'Object destructuring: const { name, age } = user;',
        'Array destructuring: const [first, second] = arr;',
        'Spread (...) copies arrays/objects or merges them.',
        'Rest (...) collects remaining items into an array.'
      ],
      code: `// Object destructuring
const user = { name: "Jenna", age: 25, role: "Dev" };
const { name, role } = user;
console.log(name); // "Jenna"

// Array destructuring
const [first, ...rest] = [1, 2, 3, 4];
console.log(first); // 1
console.log(rest);  // [2, 3, 4]

// Spread: copy and merge
const original = [1, 2, 3];
const copy = [...original, 4, 5];

const defaults = { theme: "dark", lang: "en" };
const settings = { ...defaults, lang: "es" };`,
      output: 'Variables extracted from objects/arrays, and spread copies/merges.',
      tasks: [
        'Destructure 3 properties from an object.',
        'Use array destructuring with rest.',
        'Merge two objects using spread.'
      ],
      challenge: 'Build a settings merger: take default settings and user preferences, merge with spread.',
      devFession: 'I manually typed user.name, user.age, user.email on separate lines. Destructuring does it in one.'
    }
  ]
};
