// Error Handling & Debugging
// Module 14 of 22

export const module214 = {
  id: 214,
  emoji: '🐛',
  title: 'Error Handling & Debugging',
  tagline: 'Find bugs. Fix bugs. Ship code.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j14-1',
      title: 'try/catch & Common Errors',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j13-1'],
      concepts: [
        'try/catch wraps code that might fail — catch handles the error gracefully.',
        'finally runs no matter what — useful for cleanup.',
        'ReferenceError: using a variable that doesn\'t exist.',
        'TypeError: calling something that\'s not a function, or accessing properties on null.',
        'SyntaxError: code structure is wrong — caught before runtime.'
      ],
      code: `try {
    const data = JSON.parse("not json");
} catch (error) {
    console.error("Error:", error.message);
    // "Error: Unexpected token o in JSON"
} finally {
    console.log("Always runs");
}

// Common errors
// ReferenceError: x is not defined
// TypeError: Cannot read properties of null
// SyntaxError: Unexpected token`,
      output: 'A caught JSON parse error with a clean error message.',
      tasks: [
        'Wrap a JSON.parse in try/catch.',
        'Intentionally trigger a ReferenceError and catch it.',
        'Use finally for cleanup code.'
      ],
      challenge: 'Build a safe JSON parser function that returns a default value on failure.',
      devFession: 'I console.logged the entire error object instead of error.message. The useful info was buried in noise.'
    },
    {
      id: 'j14-2',
      title: 'Debugging Like a Pro',
      difficulty: 'beginner',
      duration: '8 min',
      prereqs: ['j14-1'],
      concepts: [
        'console.log is your first tool — but console.table and console.group are better.',
        'Chrome DevTools debugger lets you step through code line by line.',
        'The debugger; keyword creates a breakpoint in your code.',
        'Read error messages carefully — they tell you the file, line, and what went wrong.',
        'Rubber duck debugging: explain your code out loud to find the problem.'
      ],
      code: `// Better console methods
const users = [
    { name: "Jenna", role: "Dev" },
    { name: "Alex", role: "Design" }
];
console.table(users);

console.group("User Data");
console.log("Count:", users.length);
console.log("First:", users[0].name);
console.groupEnd();

// Debugger breakpoint
function calculate(a, b) {
    debugger; // pauses here in DevTools
    return a + b;
}`,
      output: 'A formatted table and grouped console output.',
      tasks: [
        'Use console.table with an array of objects.',
        'Use console.group to organize related logs.',
        'Place a debugger; statement and step through code in DevTools.'
      ],
      challenge: 'Debug a broken function by adding strategic console.logs and a debugger; breakpoint.',
      devFession: 'My debugging strategy was adding console.log("HERE") everywhere. There were 14 of them. None said what they were checking.'
    }
  ]
};
