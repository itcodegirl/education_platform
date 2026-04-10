// Control Flow
// Module 4 of 22

export const module204 = {
  id: 204,
  emoji: '🔀',
  title: 'Control Flow',
  tagline: 'Make your code think and decide.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j4-1',
      title: 'if, else if, and else',
      difficulty: 'beginner',
      duration: '8 min',
      prereqs: ['j3-1'],
      concepts: [
        'if checks a condition — runs the block only if true.',
        'else if adds additional checks — evaluated top to bottom.',
        'else is the fallback — runs when nothing else matched.',
        'Only the first matching block runs, then the rest are skipped.'
      ],
      code: `const score = 85;

if (score >= 90) {
    console.log("A");
} else if (score >= 80) {
    console.log("B");
} else if (score >= 70) {
    console.log("C");
} else {
    console.log("Try again");
}
// Output: "B"`,
      output: 'The grade "B" because 85 is >= 80 but not >= 90.',
      tasks: [
        'Write an if/else if/else that checks 3 conditions.',
        'Change the values to trigger each branch.',
        'Add a fourth condition.'
      ],
      challenge: 'Build a weather advisor: temperature ranges map to clothing suggestions.',
      devFession: 'I wrote 15 separate if statements instead of else if. Every single one ran. That\'s not how decisions work.'
    },
    {
      id: 'j4-2',
      title: 'Switch & Ternary',
      difficulty: 'beginner',
      duration: '8 min',
      prereqs: ['j4-1'],
      concepts: [
        'switch compares one value against multiple cases — cleaner than many if/else chains.',
        'Always include break in each case — without it, execution "falls through."',
        'default is the switch version of else.',
        'Ternary operator: condition ? valueIfTrue : valueIfFalse — one-line if/else.'
      ],
      code: `// Switch
const day = "Monday";
switch (day) {
    case "Monday":
    case "Tuesday":
        console.log("Work day"); break;
    case "Saturday":
    case "Sunday":
        console.log("Weekend"); break;
    default:
        console.log("Midweek");
}

// Ternary
const age = 20;
const status = age >= 18 ? "Adult" : "Minor";
console.log(status); // "Adult"`,
      output: '"Work day" from switch, "Adult" from ternary.',
      tasks: [
        'Write a switch for a menu selection (1-4).',
        'Convert a simple if/else into a ternary.',
        'Forget a break statement and observe the fall-through bug.'
      ],
      challenge: 'Build a day-of-week greeter using switch.',
      devFession: 'I forgot break in a switch and every case after my match executed. JavaScript was like, "You said don\'t stop."'
    }
  ]
};
