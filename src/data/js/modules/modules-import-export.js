// Modules: import & export
// Module 17 of 22

export const module217 = {
  id: 217,
  emoji: '📦',
  title: 'Modules: import & export',
  tagline: 'Organize code into files.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j17-1',
      title: 'ES Modules',
      difficulty: 'intermediate',
      duration: '10 min',
      prereqs: ['j16-1'],
      concepts: [
        'Modules let you split code across files and import what you need.',
        'export makes functions/variables available to other files.',
        'import brings them in — you choose what to import.',
        'export default exports one main thing per file.',
        'Named exports let you export multiple things.',
        'Add type="module" to your script tag to use modules in the browser.'
      ],
      code: `// math.js
export function add(a, b) {
    return a + b;
}
export function subtract(a, b) {
    return a - b;
}
export default function multiply(a, b) {
    return a * b;
}

// app.js
import multiply, { add, subtract } from "./math.js";

console.log(add(2, 3));        // 5
console.log(subtract(10, 4));  // 6
console.log(multiply(3, 4));   // 12

<!-- HTML -->
<!-- <script type="module" src="app.js"></script> -->`,
      output: 'Functions imported from one file and used in another.',
      tasks: [
        'Create a utility file with 3 exported functions.',
        'Import them into your main file.',
        'Use both default and named exports.'
      ],
      challenge: 'Split a project into 3 files: utils.js, data.js, and app.js with proper imports.',
      devFession: 'I put everything in one 800-line file. Modules would have saved me from scrolling for 10 minutes to find a function.'
    }
  ]
};
