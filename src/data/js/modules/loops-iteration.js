// Loops & Iteration
// Module 5 of 22

export const module205 = {
  id: 205,
  emoji: '🔁',
  title: 'Loops & Iteration',
  tagline: 'Repeat things without repeating yourself.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j5-1',
      title: 'for, while, and do...while',
      difficulty: 'beginner',
      duration: '12 min',
      prereqs: ['j4-2'],
      concepts: [
        'for loop: best when you know how many times to repeat.',
        'while loop: best when repeating until a condition changes.',
        'do...while: runs at least once, then checks the condition.',
        'for...of iterates over array values directly.',
        'break exits a loop early. continue skips to the next iteration.'
      ],
      code: `// for loop
for (let i = 0; i < 5; i++) {
    console.log(i); // 0, 1, 2, 3, 4
}

// while loop
let count = 0;
while (count < 3) {
    console.log(count);
    count++;
}

// do...while (runs at least once)
let num = 10;
do {
    console.log(num); // 10 (runs once)
} while (num < 5);

// for...of
const colors = ["red", "blue", "green"];
for (const color of colors) {
    console.log(color);
}

// break and continue
for (let i = 0; i < 10; i++) {
    if (i === 3) continue; // skip 3
    if (i === 7) break;    // stop at 7
    console.log(i);
}`,
      output: 'Numbers 0-4, then 0-2, then 10 (once), then colors, then 0-6 skipping 3.',
      tasks: [
        'Write a for loop that counts to 10.',
        'Write a while loop that runs until a variable hits 5.',
        'Use for...of to loop through an array of names.',
        'Use break to exit a loop early.'
      ],
      challenge: 'Build a number guessing game that loops until the user guesses correctly.',
      devFession: 'I wrote an infinite while loop. My browser froze. I learned about break that day.'
    }
  ]
};
