// Operators
// Module 3 of 22

export const module203 = {
  id: 203,
  emoji: '🔢',
  title: 'Operators',
  tagline: 'Compare, calculate, and decide.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j3-1',
      title: 'Comparison & Logical Operators',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j2-3'],
      concepts: [
        'Comparison: === (strict equal), !== (strict not equal), >, <, >=, <=.',
        '== converts types before comparing — almost always wrong.',
        'Logical AND (&&): both must be true.',
        'Logical OR (||): at least one must be true.',
        'Logical NOT (!): flips true/false.',
        'Short-circuit: && stops at first false, || stops at first true.'
      ],
      code: `// Comparison
console.log(5 === 5);     // true
console.log(5 === "5");   // false (different types)
console.log(5 == "5");    // true (coercion!)
console.log(5 !== 3);     // true
console.log(10 > 5);      // true

// Logical
const age = 25;
const hasID = true;
if (age >= 18 && hasID) {
    console.log("Entry allowed");
}

const isAdmin = false;
const isMod = true;
if (isAdmin || isMod) {
    console.log("Has permissions");
}

// Short-circuit
const name = "" || "Anonymous"; // "Anonymous"
const user = null ?? "Guest";   // "Guest" (?? = nullish)`,
      output: 'Comparison results, logical checks, and short-circuit defaults.',
      tasks: [
        'Compare 5 pairs of values using === and log results.',
        'Write an if statement that requires two conditions (&&).',
        'Use || to set a default value for a variable.'
      ],
      challenge: 'Build a login check: age >= 18 AND hasAccount AND (isVerified OR isAdmin).',
      devFession: 'I wrote if (x = 5) instead of if (x === 5). One assigns, the other compares. Tiny typo, massive bug.'
    }
  ]
};
