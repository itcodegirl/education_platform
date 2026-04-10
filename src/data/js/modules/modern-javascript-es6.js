// Modern JavaScript (ES6+)
// Module 19 of 22

export const module219 = {
  id: 219,
  emoji: '✨',
  title: 'Modern JavaScript (ES6+)',
  tagline: 'Write cleaner, modern code.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j19-1',
      title: 'Template Literals, Optional Chaining & Nullish Coalescing',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j18-1'],
      concepts: [
        'Template literals use backticks for string interpolation: `Hello ${name}`.',
        'Optional chaining (?.) safely accesses nested properties that might not exist.',
        'Nullish coalescing (??) provides defaults for null/undefined only (not "" or 0).',
        'Short-circuit with || treats "", 0, and false as "missing" — ?? is more precise.'
      ],
      code: `// Template literals
const name = "Jenna";
const greeting = \`Hello, \${name}! You have \${3 + 2} items.\`;

// Optional chaining
const user = { profile: { name: "Jenna" } };
console.log(user.profile?.name);   // "Jenna"
console.log(user.settings?.theme); // undefined (no error!)

// Nullish coalescing
const port = 0;
console.log(port || 3000);  // 3000 (wrong! 0 is valid)
console.log(port ?? 3000);  // 0 (correct!)`,
      output: 'Interpolated strings, safe property access, and precise defaults.',
      tasks: [
        'Rewrite 3 string concatenations as template literals.',
        'Use optional chaining on a deeply nested object.',
        'Compare || and ?? with the value 0.'
      ],
      challenge: 'Build a user greeting that handles missing profile data with optional chaining and defaults.',
      devFession: 'I wrote user.profile.name without checking if profile exists. TypeError: Cannot read properties of undefined.'
    }
  ]
};
