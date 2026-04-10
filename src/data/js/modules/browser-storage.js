// Browser Storage
// Module 18 of 22

export const module218 = {
  id: 218,
  emoji: '💾',
  title: 'Browser Storage',
  tagline: 'Save data between visits.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j18-1',
      title: 'localStorage & sessionStorage',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j17-1'],
      concepts: [
        'localStorage persists even after the browser closes.',
        'sessionStorage is cleared when the tab closes.',
        'Both store key-value pairs as STRINGS — use JSON for objects.',
        'setItem saves, getItem retrieves, removeItem deletes, clear wipes all.'
      ],
      code: `// Save data
localStorage.setItem("theme", "dark");
localStorage.setItem("user", JSON.stringify({
    name: "Jenna",
    score: 42
}));

// Read data
const theme = localStorage.getItem("theme");
const user = JSON.parse(
    localStorage.getItem("user")
);
console.log(theme);     // "dark"
console.log(user.name); // "Jenna"

// Remove
localStorage.removeItem("theme");

// Session (temporary)
sessionStorage.setItem("tab-id", "123");`,
      output: 'Data saved to and retrieved from localStorage.',
      tasks: [
        'Save a theme preference to localStorage.',
        'Save an object using JSON.stringify.',
        'Retrieve and parse it back with JSON.parse.',
        'Close and reopen the browser — verify data persists.'
      ],
      challenge: 'Build a dark mode toggle that remembers the user\'s choice between visits.',
      devFession: 'I saved an object without JSON.stringify and got "[object Object]" back. Always stringify.'
    }
  ]
};
