// Scope & Execution
// Module 11 of 22

export const module211 = {
  id: 211,
  emoji: '🔍',
  title: 'Scope & Execution',
  tagline: 'Where variables live and how code runs.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j11-1',
      title: 'Global, Function & Block Scope',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j10-1'],
      concepts: [
        'Global scope: accessible everywhere — avoid putting too much here.',
        'Function scope: variables inside a function are invisible outside.',
        'Block scope: let and const are confined to {} blocks.',
        'var ignores block scope — another reason to avoid it.'
      ],
      code: `// Global
const appName = "CodeHerWay";

function demo() {
    // Function scope
    const secret = "hidden";
    console.log(appName); // works (global)
}
// console.log(secret); // ERROR!

// Block scope
if (true) {
    let blockVar = "inside";
    const alsoBlock = "inside";
    var leaky = "escapes!"; // var leaks!
}
// console.log(blockVar);  // ERROR
// console.log(alsoBlock); // ERROR
console.log(leaky);        // "escapes!" — var leaks`,
      output: 'Scope demonstrations showing where variables are accessible.',
      tasks: [
        'Create variables in global, function, and block scope.',
        'Try accessing a function-scoped variable outside — read the error.',
        'Demonstrate how var leaks out of blocks.'
      ],
      challenge: 'Explain why let solved the var scoping problem with a code example.',
      devFession: 'I declared a variable inside a loop with var and it leaked everywhere. let fixed my life.'
    },
    {
      id: 'j11-2',
      title: 'Hoisting & Execution Context',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j11-1'],
      concepts: [
        'Hoisting: JS "moves" declarations to the top of their scope during compilation.',
        'Function declarations are fully hoisted — you can call them before defining them.',
        'var is hoisted but initialized as undefined — causes subtle bugs.',
        'let and const are hoisted but NOT initialized — accessing them early throws an error (TDZ).',
        'Execution context: first JS creates all variables (creation phase), then runs code (execution phase).'
      ],
      code: `// Function declaration: hoisted
console.log(greet()); // works!
function greet() {
    return "Hello!";
}

// var: hoisted as undefined
console.log(x); // undefined (not error!)
var x = 5;

// let/const: TDZ error
// console.log(y); // ReferenceError!
let y = 10;

// Function expression: NOT hoisted
// console.log(add(2, 3)); // Error!
const add = (a, b) => a + b;`,
      output: 'Hoisting differences between function declarations, var, and let/const.',
      tasks: [
        'Call a function before its declaration — verify it works.',
        'Try using a var before its declaration — observe undefined.',
        'Try using a let before its declaration — read the error.'
      ],
      challenge: 'Predict the output of 5 hoisting scenarios before running them.',
      devFession: 'I relied on hoisting and called functions before defining them. It works, but it makes code unreadable.'
    }
  ]
};
