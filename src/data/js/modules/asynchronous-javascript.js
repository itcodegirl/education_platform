// Asynchronous JavaScript
// Module 12 of 22

export const module212 = {
  id: 212,
  emoji: '⏳',
  title: 'Asynchronous JavaScript',
  tagline: 'Handle time, delays, and data fetching.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j12-1',
      title: 'Callbacks & setTimeout',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j11-2'],
      concepts: [
        'Synchronous code runs line by line. Async code can run "later."',
        'setTimeout schedules code to run after a delay.',
        'setInterval repeats code at regular intervals.',
        'Callbacks can become nested (callback hell) — Promises solve this.'
      ],
      code: `console.log("Start");

setTimeout(() => {
    console.log("After 2 seconds");
}, 2000);

console.log("End");
// Output: Start, End, After 2 seconds

// setInterval
let count = 0;
const timer = setInterval(() => {
    count++;
    console.log(count);
    if (count >= 5) clearInterval(timer);
}, 1000);`,
      output: '"Start" and "End" log immediately, "After 2 seconds" logs later.',
      tasks: [
        'Use setTimeout to log a message after 3 seconds.',
        'Create a countdown using setInterval.',
        'Clear an interval after 5 iterations.'
      ],
      challenge: 'Build a countdown timer that displays seconds remaining.',
      devFession: 'I put a 0ms setTimeout and expected it to run instantly. It doesn\'t — it waits for the call stack to clear.'
    },
    {
      id: 'j12-2',
      title: 'Promises',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j12-1'],
      concepts: [
        'A Promise represents a future value — pending, fulfilled, or rejected.',
        '.then() handles success, .catch() handles errors.',
        'Promises chain — each .then() returns a new Promise.',
        'Promise.all() runs multiple promises in parallel.'
      ],
      code: `// Creating a promise
const myPromise = new Promise((resolve, reject) => {
    const success = true;
    if (success) {
        resolve("It worked!");
    } else {
        reject("Something failed");
    }
});

myPromise
    .then(result => console.log(result))
    .catch(error => console.error(error));

// Chaining
fetch("https://jsonplaceholder.typicode.com/users/1")
    .then(response => response.json())
    .then(user => console.log(user.name))
    .catch(err => console.error(err));`,
      output: 'A resolved promise logging success, and a chained fetch logging a user name.',
      tasks: [
        'Create a Promise that resolves after 2 seconds.',
        'Chain .then() and .catch() on a fetch call.',
        'Handle an error in a rejected promise.'
      ],
      challenge: 'Fetch data from an API and display the results.',
      devFession: 'I nested 5 .then() callbacks inside each other. That\'s just callback hell with extra steps.'
    },
    {
      id: 'j12-3',
      title: 'async/await',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j12-2'],
      concepts: [
        'async/await is syntactic sugar over Promises — same thing, cleaner syntax.',
        'async makes a function return a Promise.',
        'await pauses execution until the Promise resolves.',
        'Use try/catch for error handling with async/await.'
      ],
      code: `async function getUser() {
    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users/1"
        );
        const user = await response.json();
        console.log(user.name);
    } catch (error) {
        console.error("Failed:", error);
    }
}

getUser();

// Arrow function version
const getPosts = async () => {
    const res = await fetch(
        "https://jsonplaceholder.typicode.com/posts?_limit=3"
    );
    const posts = await res.json();
    posts.forEach(p => console.log(p.title));
};`,
      output: 'User name fetched and logged, then 3 post titles.',
      tasks: [
        'Convert a .then() chain into async/await.',
        'Add try/catch error handling.',
        'Fetch and display data from a public API.'
      ],
      challenge: 'Build a function that fetches a user, then fetches their posts — all with async/await.',
      devFession: 'I used async/await without try/catch. The first error crashed everything silently.'
    }
  ]
};
