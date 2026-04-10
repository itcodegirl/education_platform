// JSON & the Fetch API
// Module 13 of 22

export const module213 = {
  id: 213,
  emoji: '🌐',
  title: 'JSON & the Fetch API',
  tagline: 'Connect to the real world.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j13-1',
      title: 'JSON & Data Fetching',
      difficulty: 'beginner',
      duration: '12 min',
      prereqs: ['j12-3'],
      concepts: [
        'JSON (JavaScript Object Notation) is the standard data format for APIs.',
        'JSON.parse() converts a JSON string to a JavaScript object.',
        'JSON.stringify() converts a JavaScript object to a JSON string.',
        'Fetch sends GET requests by default. POST requires method, headers, and body.',
        'Always check response.ok before parsing — not all responses are successful.'
      ],
      code: `// JSON conversion
const obj = { name: "Jenna", age: 25 };
const jsonStr = JSON.stringify(obj);
// '{"name":"Jenna","age":25}'
const parsed = JSON.parse(jsonStr);
// { name: "Jenna", age: 25 }

// GET request
const getUsers = async () => {
    const res = await fetch("https://api.example.com/users");
    if (!res.ok) throw new Error("Failed!");
    const data = await res.json();
    return data;
};

// POST request
const createUser = async (user) => {
    const res = await fetch("https://api.example.com/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
    });
    return await res.json();
};`,
      output: 'JSON conversion, GET request, and POST request patterns.',
      tasks: [
        'Convert an object to JSON and back.',
        'Fetch data from a public API and log it.',
        'Send a POST request with a JSON body.'
      ],
      challenge: 'Build a mini app that fetches users from an API and renders them as cards.',
      devFession: 'I forgot to JSON.stringify() my POST body. The server received "[object Object]" as the data.'
    }
  ]
};
