export const module1 = {
    id: 301,
    emoji: '⚛️',
    title: 'What React Is',
    tagline: 'The library that changed frontend forever.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r1-1',
            prereqs: [],
            title: 'Why React Exists',
            difficulty: 'beginner',
            duration: '8 min',
            concepts: ['React solves the UI complexity problem — updating the DOM manually is painful at scale.', 'Component-based architecture: build small, reusable pieces that compose into full UIs.', 'Virtual DOM: React compares a virtual copy with the real DOM and only updates what changed.', 'Declarative: you describe WHAT the UI should look like, React figures out HOW to update it.'],
            code: `// Imperative (vanilla JS) — you manage every step
const btn = document.querySelector("#btn");
btn.addEventListener("click", () => {
    const p = document.createElement("p");
    p.textContent = "Clicked!";
    document.body.appendChild(p);
});

// Declarative (React) — you describe the result
function App() {
    const [clicked, setClicked] = useState(false);
    return (
        <div>
            <button onClick={() => setClicked(true)}>Click</button>
            {clicked && <p>Clicked!</p>}
        </div>
    );
}`,
            output: 'Same result, but React lets you describe what you want instead of how to do it.',
            tasks: ['Explain the difference between imperative and declarative.', 'Describe what the Virtual DOM does in one sentence.', 'Name 3 apps built with React.'],
            challenge: 'Explain to someone non-technical why React makes building UIs easier.',
            devFession: 'I built a whole app with vanilla JS DOM manipulation. 400 lines of querySelector and appendChild. React does it in 40.'
        },
        {
            id: 'r1-2',
            prereqs: ['r1-1'],
            title: 'Setting Up with Vite',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['Vite is the modern, fast build tool for React — replaces Create React App.', 'npm create vite@latest my-app -- --template react creates a new project.', 'npm install installs dependencies, npm run dev starts the dev server.', 'The src/ folder contains your components, App.jsx is the entry point.'],
            code: `// Terminal commands:
// npm create vite@latest my-app -- --template react
// cd my-app
// npm install
// npm run dev

// Project structure:
// my-app/
//   src/
//     App.jsx      ← your main component
//     main.jsx     ← entry point (renders App)
//     App.css      ← styles
//   index.html     ← the HTML shell
//   package.json   ← dependencies & scripts`,
            output: 'A running React dev server at localhost:5173.',
            tasks: ['Create a new Vite + React project.', 'Open it in VS Code and explore the file structure.', 'Change the text in App.jsx and watch it hot-reload.'],
            challenge: 'Set up a fresh React project and replace the default content with your own heading and paragraph.',
            devFession: 'I used Create React App in 2024 and wondered why it took 45 seconds to start. Vite does it in under 1 second.'
        }
    ]
};
