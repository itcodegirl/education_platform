// ═══════════════════════════════════════════════
// REACT COURSE — 24 Modules, 50 Lessons (Rich Format)
// Complete: fundamentals → hooks → patterns → deployment
// ═══════════════════════════════════════════════

export const REACT_MODULES = [

  // ─── MODULE 1: What React Is ──────────────────
  { id: 301, emoji: '⚛️', title: 'What React Is', tagline: 'The library that changed frontend forever.', lessons: [
    { id: 'r1-1', title: 'Why React Exists',
      difficulty: 'beginner', duration: '8 min',
      concepts: ['React solves the UI complexity problem — updating the DOM manually is painful at scale.', 'Component-based architecture: build small, reusable pieces that compose into full UIs.', 'Virtual DOM: React compares a virtual copy with the real DOM and only updates what changed.', 'Declarative: you describe WHAT the UI should look like, React figures out HOW to update it.'],
      code: `// Imperative (vanilla JS) — you manage every step\nconst btn = document.querySelector("#btn");\nbtn.addEventListener("click", () => {\n    const p = document.createElement("p");\n    p.textContent = "Clicked!";\n    document.body.appendChild(p);\n});\n\n// Declarative (React) — you describe the result\nfunction App() {\n    const [clicked, setClicked] = useState(false);\n    return (\n        <div>\n            <button onClick={() => setClicked(true)}>Click</button>\n            {clicked && <p>Clicked!</p>}\n        </div>\n    );\n}`,
      output: 'Same result, but React lets you describe what you want instead of how to do it.',
      tasks: ['Explain the difference between imperative and declarative.', 'Describe what the Virtual DOM does in one sentence.', 'Name 3 apps built with React.'],
      challenge: 'Explain to someone non-technical why React makes building UIs easier.',
      devFession: 'I built a whole app with vanilla JS DOM manipulation. 400 lines of querySelector and appendChild. React does it in 40.' },
    { id: 'r1-2', title: 'Setting Up with Vite',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['Vite is the modern, fast build tool for React — replaces Create React App.', 'npm create vite@latest my-app -- --template react creates a new project.', 'npm install installs dependencies, npm run dev starts the dev server.', 'The src/ folder contains your components, App.jsx is the entry point.'],
      code: `// Terminal commands:\n// npm create vite@latest my-app -- --template react\n// cd my-app\n// npm install\n// npm run dev\n\n// Project structure:\n// my-app/\n//   src/\n//     App.jsx      ← your main component\n//     main.jsx     ← entry point (renders App)\n//     App.css      ← styles\n//   index.html     ← the HTML shell\n//   package.json   ← dependencies & scripts`,
      output: 'A running React dev server at localhost:5173.',
      tasks: ['Create a new Vite + React project.', 'Open it in VS Code and explore the file structure.', 'Change the text in App.jsx and watch it hot-reload.'],
      challenge: 'Set up a fresh React project and replace the default content with your own heading and paragraph.',
      devFession: 'I used Create React App in 2024 and wondered why it took 45 seconds to start. Vite does it in under 1 second.' },
  ]},

  // ─── MODULE 2: JSX ────────────────────────────
  { id: 302, emoji: '📝', title: 'JSX — The Language of React', tagline: 'HTML meets JavaScript.', lessons: [
    { id: 'r2-1', title: 'JSX Rules & Expressions',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['JSX looks like HTML but compiles to JavaScript function calls.', 'Rule 1: Every component must return ONE parent element (use <div> or <>).', 'Rule 2: Use className instead of class, htmlFor instead of for.', 'Rule 3: All tags must be closed — including self-closing (<img />, <br />).', 'Embed JavaScript in JSX with curly braces: {expression}.'],
      code: `function Profile() {\n    const name = "Jenna";\n    const skills = ["HTML", "CSS", "JS"];\n    const isOnline = true;\n\n    return (\n        <div className="profile">\n            <h1>Hello, {name}!</h1>\n            <p>Skills: {skills.length}</p>\n            <p>Status: {isOnline ? "Online" : "Offline"}</p>\n            <img src="avatar.jpg" alt="Profile" />\n        </div>\n    );\n}`,
      output: 'A profile component with dynamic name, skill count, and status.',
      tasks: ['Create a component that uses className and embeds a variable.', 'Use a ternary expression inside JSX.', 'Return multiple elements wrapped in a fragment (<>...</>).'],
      challenge: 'Build a user card component that displays name, email, and "Active"/"Inactive" status dynamically.',
      devFession: 'I wrote class= instead of className= and spent 20 minutes debugging. React warns you, but only in the console.' },
  ]},

  // ─── MODULE 3: Components ─────────────────────
  { id: 303, emoji: '🧱', title: 'Components', tagline: 'Small pieces. Big apps.', lessons: [
    { id: 'r3-1', title: 'Creating & Composing Components',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['Components are functions that return JSX — they\'re reusable UI pieces.', 'Component names MUST start with a capital letter (PascalCase).', 'Composition: build complex UIs by nesting components inside each other.', 'Each component should do ONE thing well — single responsibility.'],
      code: `function Header() {\n    return <header><h1>CodeHerWay</h1></header>;\n}\n\nfunction Card({ title, children }) {\n    return (\n        <div className="card">\n            <h3>{title}</h3>\n            {children}\n        </div>\n    );\n}\n\nfunction App() {\n    return (\n        <div>\n            <Header />\n            <Card title="Lesson 1">\n                <p>Learn components!</p>\n            </Card>\n            <Card title="Lesson 2">\n                <p>Learn props!</p>\n            </Card>\n        </div>\n    );\n}`,
      output: 'A header and two reusable card components composed together.',
      tasks: ['Create 3 small components.', 'Compose them inside an App component.', 'Use the children prop to pass content into a wrapper component.'],
      challenge: 'Build a page layout with Header, Sidebar, Main, and Footer — each as a separate component.',
      devFession: 'I put everything in one giant App component. 500 lines. It worked until I needed to change anything.' },
  ]},

  // ─── MODULE 4: Props ──────────────────────────
  { id: 304, emoji: '📨', title: 'Props', tagline: 'Pass data down, keep components flexible.', lessons: [
    { id: 'r4-1', title: 'Props & Data Flow',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['Props are how parent components pass data to children.', 'Props are read-only — a child can never modify its own props.', 'Destructure props in the function signature for cleaner code.', 'Data flows ONE direction in React: parent → child (unidirectional).'],
      code: `function Badge({ label, color }) {\n    return (\n        <span style={{ background: color, padding: "4px 12px",\n                        borderRadius: "12px", color: "#fff" }}>\n            {label}\n        </span>\n    );\n}\n\nfunction UserCard({ name, role, isActive }) {\n    return (\n        <div className="card">\n            <h3>{name}</h3>\n            <p>{role}</p>\n            <Badge\n                label={isActive ? "Active" : "Inactive"}\n                color={isActive ? "#4ecdc4" : "#888"}\n            />\n        </div>\n    );\n}\n\n// Usage:\n<UserCard name="Jenna" role="Developer" isActive={true} />`,
      output: 'A user card with a dynamic badge — all data passed via props.',
      tasks: ['Create a component that accepts 3 props.', 'Pass different values to render different variations.', 'Use destructuring to access props cleanly.'],
      challenge: 'Build a ProductCard component that takes name, price, image, and inStock props.',
      devFession: 'I tried to change a prop inside a child component. React said no. Props are read-only. Use state if you need to change things.' },
  ]},

  // ─── MODULE 5: Events ─────────────────────────
  { id: 305, emoji: '🖱️', title: 'Events in React', tagline: 'Make things respond.', lessons: [
    { id: 'r5-1', title: 'Handling Events',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['React events use camelCase: onClick, onChange, onSubmit.', 'Pass a function reference, not a function call: onClick={handleClick} not onClick={handleClick()}.', 'The event object (e) works like vanilla JS — e.target, e.preventDefault().', 'Common events: onClick (buttons), onChange (inputs), onSubmit (forms).'],
      code: `function App() {\n    function handleClick() {\n        alert("Button clicked!");\n    }\n\n    function handleInput(e) {\n        console.log("Typed:", e.target.value);\n    }\n\n    function handleSubmit(e) {\n        e.preventDefault();\n        console.log("Form submitted!");\n    }\n\n    return (\n        <div>\n            <button onClick={handleClick}>Click Me</button>\n            <input onChange={handleInput} placeholder="Type..." />\n            <form onSubmit={handleSubmit}>\n                <button type="submit">Submit</button>\n            </form>\n        </div>\n    );\n}`,
      output: 'A button click, input change, and form submit — all handled in React.',
      tasks: ['Add onClick to a button that logs a message.', 'Add onChange to an input that logs the value.', 'Add onSubmit to a form with preventDefault.'],
      challenge: 'Build a counter with increment, decrement, and reset buttons.',
      devFession: 'I wrote onClick={handleClick()} with parentheses. It fired immediately on render, not on click. No parentheses!' },
  ]},

  // ─── MODULE 6: State & useState ───────────────
  { id: 306, emoji: '🔄', title: 'State & useState', tagline: 'Data that changes. UI that reacts.', lessons: [
    { id: 'r6-1', title: 'Introduction to State',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['State is data that can change over time — when it changes, React re-renders.', 'useState returns [value, setter] — always destructure both.', 'Never modify state directly — always use the setter function.', 'State is LOCAL to the component — each instance has its own state.'],
      code: `import { useState } from "react";\n\nfunction Counter() {\n    const [count, setCount] = useState(0);\n\n    return (\n        <div>\n            <p>Count: {count}</p>\n            <button onClick={() => setCount(count + 1)}>+</button>\n            <button onClick={() => setCount(count - 1)}>-</button>\n            <button onClick={() => setCount(0)}>Reset</button>\n        </div>\n    );\n}`,
      output: 'A counter that increments, decrements, and resets.',
      tasks: ['Create a counter with useState.', 'Add a reset button.', 'Create a toggle that switches between "ON" and "OFF".'],
      challenge: 'Build a light/dark mode toggle using useState.',
      devFession: 'I set state directly: count = count + 1. Nothing happened. React only re-renders when you use the setter.' },
    { id: 'r6-2', title: 'State with Objects & Arrays',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['When state is an object, spread the old state and override what changed.', 'When state is an array, use map/filter/spread — never push/pop directly.', 'React uses reference comparison — you must create a NEW object/array for it to detect changes.', 'Functional updates (prev => ...) are safer when state depends on previous state.'],
      code: `// Object state\nconst [user, setUser] = useState({ name: "", email: "" });\nsetUser(prev => ({ ...prev, name: "Jenna" }));\n\n// Array state\nconst [todos, setTodos] = useState([]);\n\n// Add\nsetTodos(prev => [...prev, { id: Date.now(), text: "New" }]);\n\n// Remove\nsetTodos(prev => prev.filter(t => t.id !== idToRemove));\n\n// Update one item\nsetTodos(prev => prev.map(t =>\n    t.id === id ? { ...t, done: !t.done } : t\n));`,
      output: 'Object and array state updated immutably with spread and map/filter.',
      tasks: ['Create a form that updates an object in state.', 'Build a list where you can add and remove items.', 'Toggle a "done" property on a list item.'],
      challenge: 'Build a mini todo app with add, delete, and toggle complete.',
      devFession: 'I did todos.push(newItem) and the list didn\'t update. Array.push mutates — React needs a new array to re-render.' },
    { id: 'r6-3', title: 'Lifting State Up',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['When two sibling components need the same data, move state to their shared parent.', 'The parent owns the state and passes it down as props.', 'Children communicate UP by calling functions passed as props.', 'This is React\'s core data flow pattern.'],
      code: `function App() {\n    const [theme, setTheme] = useState("light");\n    return (\n        <div className={theme}>\n            <ThemeToggle theme={theme} onToggle={() =>\n                setTheme(t => t === "light" ? "dark" : "light")\n            } />\n            <Content theme={theme} />\n        </div>\n    );\n}\n\nfunction ThemeToggle({ theme, onToggle }) {\n    return <button onClick={onToggle}>Current: {theme}</button>;\n}\n\nfunction Content({ theme }) {\n    return <p>Theme is: {theme}</p>;\n}`,
      output: 'Two siblings sharing state through their parent.',
      tasks: ['Move state from a child to a parent component.', 'Pass state down as props and a setter function.', 'Have a child trigger a state change in the parent.'],
      challenge: 'Build a temperature converter where Celsius and Fahrenheit inputs stay in sync via lifted state.',
      devFession: 'I tried to share state between siblings by importing it. That\'s not how React works. State lives in the closest common parent.' },
  ]},

  // ─── MODULE 7: Conditional Rendering & Lists ──
  { id: 307, emoji: '📋', title: 'Conditional Rendering & Lists', tagline: 'Show, hide, and repeat.', lessons: [
    { id: 'r7-1', title: 'Conditional Rendering',
      difficulty: 'beginner', duration: '8 min',
      concepts: ['Ternary: {condition ? <A /> : <B />} — show one or the other.', 'Logical AND: {condition && <A />} — show or hide.', 'Early return: if (!data) return <Loading /> — guard clauses.', 'Never use if/else directly inside JSX — use ternary or && instead.'],
      code: `function Dashboard({ user, isLoading }) {\n    if (isLoading) return <p>Loading...</p>;\n    if (!user) return <p>Please log in.</p>;\n\n    return (\n        <div>\n            <h1>Welcome, {user.name}!</h1>\n            {user.isAdmin && <button>Admin Panel</button>}\n            <p>Role: {user.isAdmin ? "Admin" : "User"}</p>\n        </div>\n    );\n}`,
      output: 'Loading state, login prompt, or dashboard — depending on conditions.',
      tasks: ['Use a ternary to show different text based on a boolean.', 'Use && to conditionally render a component.', 'Use an early return for a loading state.'],
      challenge: 'Build a login/dashboard view that switches based on authentication state.',
      devFession: 'I wrote if/else inside JSX. It broke. Use ternary or && inside JSX, or early returns above the return statement.' },
    { id: 'r7-2', title: 'Lists & Keys',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['Use .map() to render an array of items as JSX elements.', 'Every list item MUST have a unique key prop — React uses it to track changes.', 'Keys should be stable IDs, not array indexes (indexes cause bugs with reordering).', 'Without keys, React can\'t tell which items changed, were added, or removed.'],
      code: `function TodoList({ todos }) {\n    return (\n        <ul>\n            {todos.map(todo => (\n                <li key={todo.id}\n                    className={todo.done ? "done" : ""}>\n                    {todo.text}\n                </li>\n            ))}\n        </ul>\n    );\n}\n\n// Usage:\nconst todos = [\n    { id: 1, text: "Learn React", done: true },\n    { id: 2, text: "Build a project", done: false },\n    { id: 3, text: "Get hired", done: false },\n];`,
      output: 'A rendered list of todos with unique keys and conditional styling.',
      tasks: ['Render an array of names as a list.', 'Add unique key props to each list item.', 'Style completed items differently.'],
      challenge: 'Build a contact list that renders from an array of objects with name, email, and phone.',
      devFession: 'I used array index as key, reordered items, and React recycled the wrong elements. Use unique IDs.' },
  ]},

  // ─── MODULE 8: Forms ──────────────────────────
  { id: 308, emoji: '📝', title: 'Forms in React', tagline: 'Controlled inputs, clean data.', lessons: [
    { id: 'r8-1', title: 'Controlled Components & Form Handling',
      difficulty: 'beginner', duration: '12 min',
      concepts: ['Controlled components: React state is the single source of truth for input values.', 'value={state} + onChange={setSetter} = controlled input.', 'onSubmit on the form + e.preventDefault() handles submission.', 'Manage multiple inputs with one state object.'],
      code: `function ContactForm() {\n    const [form, setForm] = useState({ name: "", email: "", message: "" });\n\n    const handleChange = (e) => {\n        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));\n    };\n\n    const handleSubmit = (e) => {\n        e.preventDefault();\n        console.log("Submitted:", form);\n        setForm({ name: "", email: "", message: "" });\n    };\n\n    return (\n        <form onSubmit={handleSubmit}>\n            <input name="name" value={form.name}\n                   onChange={handleChange} placeholder="Name" />\n            <input name="email" value={form.email}\n                   onChange={handleChange} placeholder="Email" />\n            <textarea name="message" value={form.message}\n                      onChange={handleChange} placeholder="Message" />\n            <button type="submit">Send</button>\n        </form>\n    );\n}`,
      output: 'A controlled form with name, email, message, and submit handling.',
      tasks: ['Build a controlled input with value and onChange.', 'Handle multiple inputs with one state object.', 'Clear the form after submission.'],
      challenge: 'Build a registration form with validation — show errors for empty or invalid fields.',
      devFession: 'I forgot to add value= to my input and it became uncontrolled. React was tracking nothing.' },
  ]},

  // ─── MODULE 9: useEffect ──────────────────────
  { id: 309, emoji: '🔁', title: 'useEffect', tagline: 'Side effects, the React way.', lessons: [
    { id: 'r9-1', title: 'Side Effects & the Dependency Array',
      difficulty: 'beginner', duration: '14 min',
      concepts: ['useEffect runs code AFTER render — for API calls, timers, subscriptions.', 'Empty dependency array [] = runs once on mount (like componentDidMount).', 'With dependencies [x, y] = re-runs when x or y changes.', 'No array = runs after EVERY render (usually a mistake).', 'Return a cleanup function to stop timers, unsubscribe, etc.'],
      code: `import { useState, useEffect } from "react";\n\nfunction UserProfile({ userId }) {\n    const [user, setUser] = useState(null);\n    const [loading, setLoading] = useState(true);\n\n    useEffect(() => {\n        setLoading(true);\n        fetch(\`https://api.example.com/users/\${userId}\`)\n            .then(res => res.json())\n            .then(data => {\n                setUser(data);\n                setLoading(false);\n            });\n    }, [userId]); // re-fetches when userId changes\n\n    // Cleanup example\n    useEffect(() => {\n        const timer = setInterval(() => console.log("tick"), 1000);\n        return () => clearInterval(timer); // cleanup\n    }, []);\n\n    if (loading) return <p>Loading...</p>;\n    return <h1>{user?.name}</h1>;\n}`,
      output: 'A user profile that fetches data on mount and when userId changes.',
      tasks: ['Fetch data in a useEffect with an empty dependency array.', 'Add a dependency that triggers a re-fetch.', 'Add a cleanup function that clears a timer.'],
      challenge: 'Build a component that fetches and displays a random joke on mount, with a "New Joke" button.',
      devFession: 'I forgot the dependency array and my useEffect ran infinitely, sending 10,000 API requests in 5 seconds.' },
  ]},

  // ─── MODULE 10: useRef & Custom Hooks ─────────
  { id: 310, emoji: '🪝', title: 'useRef & Custom Hooks', tagline: 'Advanced tools for real apps.', lessons: [
    { id: 'r10-1', title: 'useRef',
      difficulty: 'beginner', duration: '8 min',
      concepts: ['useRef stores a mutable value that persists across renders WITHOUT causing re-renders.', 'Common use: reference DOM elements directly (like focusing an input).', 'Also used for: storing previous values, timers, and any mutable data.', 'ref.current holds the value — it doesn\'t trigger re-renders when changed.'],
      code: `import { useRef, useEffect } from "react";\n\nfunction SearchBar() {\n    const inputRef = useRef(null);\n\n    useEffect(() => {\n        inputRef.current.focus(); // auto-focus on mount\n    }, []);\n\n    return <input ref={inputRef} placeholder="Search..." />;\n}\n\n// Storing previous value\nfunction Counter() {\n    const [count, setCount] = useState(0);\n    const prevCount = useRef(0);\n\n    useEffect(() => {\n        prevCount.current = count;\n    }, [count]);\n\n    return <p>Now: {count}, Before: {prevCount.current}</p>;\n}`,
      output: 'An auto-focused input and a counter that tracks its previous value.',
      tasks: ['Use useRef to auto-focus an input on mount.', 'Store a previous value with useRef.', 'Explain why useRef doesn\'t cause re-renders.'],
      challenge: 'Build a stopwatch using useRef to store the interval ID.',
      devFession: 'I used useState to store a timer ID. Every update re-rendered the component. useRef stores values silently.' },
    { id: 'r10-2', title: 'Custom Hooks',
      difficulty: 'intermediate', duration: '12 min',
      concepts: ['Custom hooks extract reusable logic into a function that starts with "use".', 'They can use any built-in hook inside (useState, useEffect, etc.).', 'Common custom hooks: useFetch, useLocalStorage, useDebounce, useToggle.', 'Custom hooks make components cleaner by moving complex logic out.'],
      code: `// useFetch — reusable data fetching\nfunction useFetch(url) {\n    const [data, setData] = useState(null);\n    const [loading, setLoading] = useState(true);\n    const [error, setError] = useState(null);\n\n    useEffect(() => {\n        setLoading(true);\n        fetch(url)\n            .then(res => res.json())\n            .then(setData)\n            .catch(setError)\n            .finally(() => setLoading(false));\n    }, [url]);\n\n    return { data, loading, error };\n}\n\n// Usage — clean component!\nfunction UserList() {\n    const { data: users, loading, error } = useFetch("/api/users");\n    if (loading) return <p>Loading...</p>;\n    if (error) return <p>Error!</p>;\n    return users.map(u => <p key={u.id}>{u.name}</p>);\n}`,
      output: 'A reusable useFetch hook used in a clean component.',
      tasks: ['Create a useToggle custom hook.', 'Create a useLocalStorage hook that syncs state to localStorage.', 'Refactor a component to use a custom hook.'],
      challenge: 'Build a useFetch hook and use it in 3 different components.',
      devFession: 'I copy-pasted the same fetch logic into 7 components. Custom hooks let you write it once and reuse everywhere.' },
  ]},

  // ─── MODULE 11: useContext ────────────────────
  { id: 311, emoji: '🌐', title: 'Context & Global State', tagline: 'Share data without prop drilling.', lessons: [
    { id: 'r11-1', title: 'useContext & the Provider Pattern',
      difficulty: 'beginner', duration: '12 min',
      concepts: ['Context solves prop drilling — passing data through many layers of components.', 'createContext creates a context, Provider wraps components that need access.', 'useContext consumes the value in any child component.', 'Common uses: theme, auth state, user preferences, language.'],
      code: `import { createContext, useContext, useState } from "react";\n\nconst ThemeContext = createContext();\n\nfunction ThemeProvider({ children }) {\n    const [theme, setTheme] = useState("dark");\n    const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");\n    return (\n        <ThemeContext.Provider value={{ theme, toggle }}>\n            {children}\n        </ThemeContext.Provider>\n    );\n}\n\nfunction Header() {\n    const { theme, toggle } = useContext(ThemeContext);\n    return (\n        <header className={theme}>\n            <button onClick={toggle}>Theme: {theme}</button>\n        </header>\n    );\n}\n\nfunction App() {\n    return (\n        <ThemeProvider>\n            <Header />\n        </ThemeProvider>\n    );\n}`,
      output: 'A theme toggle accessible from any component without prop drilling.',
      tasks: ['Create a context with createContext.', 'Wrap your app in a Provider.', 'Consume the context in a deeply nested component.'],
      challenge: 'Build an auth context with user state, login, and logout functions.',
      devFession: 'I passed props through 6 levels of components. Then I learned about Context. Six levels became zero.' },
    { id: 'r11-2', title: 'Props vs State vs Context',
      difficulty: 'beginner', duration: '8 min',
      concepts: ['Props: data passed from parent to child. Read-only. For component configuration.', 'State: data owned by a component that changes over time. Triggers re-renders.', 'Context: data shared across many components without passing through every level.', 'Rule of thumb: start with props, add state when things change, add context when drilling gets painful.'],
      code: `// Props: configuration\n<Button label="Submit" color="blue" />\n\n// State: local interactive data\nconst [count, setCount] = useState(0);\n\n// Context: global shared data\nconst { user } = useContext(AuthContext);\n\n// Decision tree:\n// Does only this component need it? → State\n// Does a child need it? → Props\n// Do many components across the tree need it? → Context`,
      output: 'A decision framework for choosing props, state, or context.',
      tasks: ['Identify 3 things that should be props, state, and context in a todo app.', 'Refactor a prop-drilled value into context.', 'Explain when state becomes context.'],
      challenge: 'Diagram the data flow of a shopping cart: which data is props, state, and context?',
      devFession: 'I put everything in context. Then every component re-rendered on every change. Context is for shared data, not all data.' },
  ]},

  // ─── MODULE 12: Styling ───────────────────────
  { id: 312, emoji: '🎨', title: 'Styling in React', tagline: 'Make it beautiful.', lessons: [
    { id: 'r12-1', title: 'CSS Approaches & Dynamic Styling',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['Regular CSS files: import "./styles.css" — simple but global.', 'CSS Modules: import styles from "./Button.module.css" — scoped to component.', 'Inline styles: style={{ color: "red" }} — object syntax, camelCase properties.', 'Tailwind CSS: utility classes directly in JSX — fast and popular.', 'Dynamic classes: className={isActive ? "active" : ""}.'],
      code: `// CSS Modules\nimport styles from "./Button.module.css";\nfunction Button({ variant }) {\n    return <button className={styles[variant]}>Click</button>;\n}\n\n// Dynamic classes\nfunction Tab({ label, isActive }) {\n    return (\n        <button className={\`tab \${isActive ? "active" : ""}\`}>\n            {label}\n        </button>\n    );\n}\n\n// Inline (useful for dynamic values)\nfunction ProgressBar({ percent }) {\n    return (\n        <div className="bar">\n            <div style={{ width: \`\${percent}%\`,\n                          background: percent > 80 ? "green" : "orange" }} />\n        </div>\n    );\n}`,
      output: 'CSS Modules, dynamic classes, and inline styles for a progress bar.',
      tasks: ['Import a CSS file and apply classes.', 'Use a CSS Module for scoped styles.', 'Apply dynamic inline styles based on a prop.'],
      challenge: 'Build a button component with "primary", "secondary", and "danger" variants using dynamic classes.',
      devFession: 'I used inline styles for everything. The components were unreadable. CSS files or modules are almost always better.' },
  ]},

  // ─── MODULE 13: React Router ──────────────────
  { id: 313, emoji: '🧭', title: 'React Router', tagline: 'Multiple pages, one app.', lessons: [
    { id: 'r13-1', title: 'Client-Side Routing',
      difficulty: 'beginner', duration: '14 min',
      concepts: ['React Router enables multi-page navigation without full page reloads.', 'BrowserRouter wraps your app, Routes contains Route definitions.', 'Link replaces <a> tags for navigation — no page refresh.', 'useParams reads URL parameters, useNavigate programmatically navigates.'],
      code: `import { BrowserRouter, Routes, Route, Link,\n         useParams, useNavigate } from "react-router-dom";\n\nfunction App() {\n    return (\n        <BrowserRouter>\n            <nav>\n                <Link to="/">Home</Link>\n                <Link to="/about">About</Link>\n                <Link to="/user/42">User 42</Link>\n            </nav>\n            <Routes>\n                <Route path="/" element={<Home />} />\n                <Route path="/about" element={<About />} />\n                <Route path="/user/:id" element={<UserProfile />} />\n                <Route path="*" element={<NotFound />} />\n            </Routes>\n        </BrowserRouter>\n    );\n}\n\nfunction UserProfile() {\n    const { id } = useParams();\n    const navigate = useNavigate();\n    return (\n        <div>\n            <h1>User {id}</h1>\n            <button onClick={() => navigate("/")}>Go Home</button>\n        </div>\n    );\n}`,
      output: 'A multi-page app with Home, About, dynamic User, and 404 routes.',
      tasks: ['Set up React Router with 3 routes.', 'Create a dynamic route with useParams.', 'Use useNavigate to redirect after a form submit.'],
      challenge: 'Build a blog app with routes for home (/), post list (/posts), and individual post (/posts/:id).',
      devFession: 'I used <a href> instead of <Link> and the entire app reloaded on every navigation. Link prevents that.' },
  ]},

  // ─── MODULE 14: Data Fetching ─────────────────
  { id: 314, emoji: '📡', title: 'Data Fetching & Async Patterns', tagline: 'Connect your app to the world.', lessons: [
    { id: 'r14-1', title: 'Fetching, Loading & Error States',
      difficulty: 'beginner', duration: '14 min',
      concepts: ['Fetch data inside useEffect — never directly in the component body.', 'Track three states: data, loading, error — handle all three in JSX.', 'Use async/await inside useEffect with an inner async function.', 'Cancel ongoing requests when the component unmounts (AbortController).'],
      code: `function UserList() {\n    const [users, setUsers] = useState([]);\n    const [loading, setLoading] = useState(true);\n    const [error, setError] = useState(null);\n\n    useEffect(() => {\n        const controller = new AbortController();\n        async function fetchUsers() {\n            try {\n                const res = await fetch(\n                    "https://jsonplaceholder.typicode.com/users",\n                    { signal: controller.signal }\n                );\n                if (!res.ok) throw new Error("Failed to fetch");\n                const data = await res.json();\n                setUsers(data);\n            } catch (err) {\n                if (err.name !== "AbortError") setError(err.message);\n            } finally {\n                setLoading(false);\n            }\n        }\n        fetchUsers();\n        return () => controller.abort();\n    }, []);\n\n    if (loading) return <p>Loading...</p>;\n    if (error) return <p>Error: {error}</p>;\n    return users.map(u => <p key={u.id}>{u.name}</p>);\n}`,
      output: 'A user list with loading spinner, error handling, and request cleanup.',
      tasks: ['Fetch data with loading and error states.', 'Display different UI for loading, error, and success.', 'Add AbortController cleanup.'],
      challenge: 'Build a search page that fetches results as the user types (with debouncing).',
      devFession: 'I forgot to handle the loading state and the page showed nothing for 2 seconds. Users thought it was broken.' },
  ]},

  // ─── MODULE 15: useReducer ────────────────────
  { id: 315, emoji: '🧰', title: 'useReducer', tagline: 'Complex state, simplified.', lessons: [
    { id: 'r15-1', title: 'useReducer for Complex State',
      difficulty: 'intermediate', duration: '12 min',
      concepts: ['useReducer is useState for complex state logic — multiple related values.', 'A reducer function takes (state, action) and returns new state.', 'Actions describe WHAT happened: { type: "INCREMENT" }.', 'dispatch sends actions to the reducer.', 'Use when: state has many sub-values, or next state depends on previous state.'],
      code: `import { useReducer } from "react";\n\nfunction reducer(state, action) {\n    switch (action.type) {\n        case "INCREMENT": return { ...state, count: state.count + 1 };\n        case "DECREMENT": return { ...state, count: state.count - 1 };\n        case "SET_NAME":  return { ...state, name: action.payload };\n        case "RESET":     return { count: 0, name: "" };\n        default: return state;\n    }\n}\n\nfunction App() {\n    const [state, dispatch] = useReducer(reducer, { count: 0, name: "" });\n    return (\n        <div>\n            <p>{state.name}: {state.count}</p>\n            <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>\n            <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>\n            <input onChange={e =>\n                dispatch({ type: "SET_NAME", payload: e.target.value })\n            } />\n        </div>\n    );\n}`,
      output: 'A counter with name input managed by useReducer.',
      tasks: ['Convert a useState component to useReducer.', 'Create a reducer with 4+ action types.', 'Dispatch actions from buttons and inputs.'],
      challenge: 'Build a shopping cart with ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, and CLEAR actions.',
      devFession: 'I had 8 useState calls in one component. useReducer consolidated them into one state object with clear actions.' },
  ]},

  // ─── MODULE 16: Performance ───────────────────
  { id: 316, emoji: '⚡', title: 'Performance & Optimization', tagline: 'Make it fast. Keep it fast.', lessons: [
    { id: 'r16-1', title: 'React.memo, useMemo & useCallback',
      difficulty: 'intermediate', duration: '14 min',
      concepts: ['React re-renders a component when its state or props change.', 'React.memo wraps a component to skip re-renders if props haven\'t changed.', 'useMemo caches an expensive calculation — only recalculates when dependencies change.', 'useCallback caches a function reference — prevents child re-renders from new function references.', 'Don\'t optimize prematurely — only use these when you notice performance issues.'],
      code: `import { memo, useMemo, useCallback } from "react";\n\n// React.memo: skip re-render if props are same\nconst ExpensiveList = memo(function ExpensiveList({ items }) {\n    console.log("List rendered");\n    return items.map(i => <p key={i.id}>{i.name}</p>);\n});\n\nfunction App() {\n    const [count, setCount] = useState(0);\n    const [items] = useState([{ id: 1, name: "A" }, { id: 2, name: "B" }]);\n\n    // useMemo: cache calculation\n    const total = useMemo(() => {\n        return items.reduce((sum, i) => sum + i.price, 0);\n    }, [items]);\n\n    // useCallback: cache function\n    const handleClick = useCallback(() => {\n        console.log("clicked");\n    }, []);\n\n    return (\n        <div>\n            <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n            <ExpensiveList items={items} onClick={handleClick} />\n        </div>\n    );\n}`,
      output: 'ExpensiveList only re-renders when items change, not when count changes.',
      tasks: ['Wrap a component in React.memo.', 'Use useMemo to cache a filtered list.', 'Use useCallback on a function passed to a memoized child.'],
      challenge: 'Identify a re-render issue in a component and fix it with memo/useMemo/useCallback.',
      devFession: 'I wrapped everything in React.memo. It made things slower because the comparison itself costs performance. Only memo what needs it.' },
  ]},

  // ─── MODULE 17: Error Boundaries ──────────────
  { id: 317, emoji: '🛡️', title: 'Error Boundaries', tagline: 'Apps that don\'t crash.', lessons: [
    { id: 'r17-1', title: 'Error Boundaries & Fallback UI',
      difficulty: 'intermediate', duration: '10 min',
      concepts: ['Error boundaries catch JavaScript errors in child components during rendering.', 'They display a fallback UI instead of crashing the entire app.', 'Error boundaries must be class components (no hook equivalent yet).', 'Use react-error-boundary library for a simpler, modern approach.'],
      code: `import { ErrorBoundary } from "react-error-boundary";\n\nfunction ErrorFallback({ error, resetErrorBoundary }) {\n    return (\n        <div className="error">\n            <h2>Something went wrong</h2>\n            <p>{error.message}</p>\n            <button onClick={resetErrorBoundary}>Try Again</button>\n        </div>\n    );\n}\n\nfunction App() {\n    return (\n        <ErrorBoundary FallbackComponent={ErrorFallback}>\n            <Dashboard />\n        </ErrorBoundary>\n    );\n}\n\n// This component might throw\nfunction Dashboard() {\n    const [data] = useFetch("/api/data");\n    if (!data) throw new Error("Failed to load");\n    return <h1>{data.title}</h1>;\n}`,
      output: 'A dashboard that shows a friendly error message instead of crashing.',
      tasks: ['Install react-error-boundary.', 'Wrap a component in an ErrorBoundary.', 'Create a custom fallback component with a retry button.'],
      challenge: 'Add error boundaries around 3 sections of your app so one failure doesn\'t crash everything.',
      devFession: 'My whole app white-screened because one component threw an error. Error boundaries contain the blast radius.' },
  ]},

  // ─── MODULE 18: Advanced Patterns ─────────────
  { id: 318, emoji: '🧬', title: 'Advanced Patterns', tagline: 'Code splitting, portals, and HOCs.', lessons: [
    { id: 'r18-1', title: 'Code Splitting & Lazy Loading',
      difficulty: 'intermediate', duration: '10 min',
      concepts: ['React.lazy loads components only when needed — reduces initial bundle size.', 'Suspense wraps lazy components and shows a fallback while loading.', 'Useful for routes, modals, and heavy components that aren\'t needed immediately.'],
      code: `import { lazy, Suspense } from "react";\n\nconst HeavyChart = lazy(() => import("./HeavyChart"));\nconst AdminPanel = lazy(() => import("./AdminPanel"));\n\nfunction App() {\n    return (\n        <div>\n            <Suspense fallback={<p>Loading chart...</p>}>\n                <HeavyChart />\n            </Suspense>\n\n            {isAdmin && (\n                <Suspense fallback={<p>Loading admin...</p>}>\n                    <AdminPanel />\n                </Suspense>\n            )}\n        </div>\n    );\n}`,
      output: 'Components loaded on demand with loading fallbacks.',
      tasks: ['Lazy load a component with React.lazy.', 'Add a Suspense boundary with a loading message.', 'Lazy load route components.'],
      challenge: 'Split your app\'s routes into lazy-loaded chunks.',
      devFession: 'My bundle was 2MB. Users waited 8 seconds to load. Lazy loading cut it to 400KB initial load.' },
    { id: 'r18-2', title: 'Portals & Component Patterns',
      difficulty: 'intermediate', duration: '10 min',
      concepts: ['Portals render children outside the parent DOM hierarchy — useful for modals and tooltips.', 'createPortal(jsx, domNode) renders into any DOM node, even outside #root.', 'Higher-Order Components (HOCs) wrap components to add reusable behavior.', 'Render props pass a function as children for flexible composition.'],
      code: `import { createPortal } from "react-dom";\n\n// Portal: renders modal outside the component tree\nfunction Modal({ isOpen, onClose, children }) {\n    if (!isOpen) return null;\n    return createPortal(\n        <div className="modal-overlay" onClick={onClose}>\n            <div className="modal" onClick={e => e.stopPropagation()}>\n                {children}\n                <button onClick={onClose}>Close</button>\n            </div>\n        </div>,\n        document.getElementById("modal-root")\n    );\n}\n\n// HOC: adds loading behavior\nfunction withLoading(Component) {\n    return function WithLoading({ isLoading, ...props }) {\n        if (isLoading) return <p>Loading...</p>;\n        return <Component {...props} />;\n    };\n}\nconst UserListWithLoading = withLoading(UserList);`,
      output: 'A portal-based modal and a higher-order component for loading states.',
      tasks: ['Create a modal using createPortal.', 'Add a <div id="modal-root"> to your index.html.', 'Write a simple HOC that adds a wrapper behavior.'],
      challenge: 'Build a reusable Modal component with portal rendering and backdrop click to close.',
      devFession: 'I rendered a modal inside a div with overflow:hidden. It got clipped. Portals render outside the parent tree.' },
  ]},

  // ─── MODULE 19: Component Design ──────────────
  { id: 319, emoji: '🏛️', title: 'Component Design Patterns', tagline: 'Architect components like a pro.', lessons: [
    { id: 'r19-1', title: 'Smart vs Dumb Components',
      difficulty: 'intermediate', duration: '10 min',
      concepts: ['Presentational (dumb) components: just render UI from props — no state, no logic.', 'Container (smart) components: manage state, fetch data, handle logic.', 'This separation makes components more reusable and testable.', 'Feature-based folder structure: group by feature, not by type.'],
      code: `// Presentational (dumb) — just renders\nfunction UserCard({ name, email, avatar }) {\n    return (\n        <div className="card">\n            <img src={avatar} alt={name} />\n            <h3>{name}</h3>\n            <p>{email}</p>\n        </div>\n    );\n}\n\n// Container (smart) — manages data\nfunction UserCardContainer({ userId }) {\n    const { data: user, loading } = useFetch(\`/api/users/\${userId}\`);\n    if (loading) return <Skeleton />;\n    return <UserCard {...user} />;\n}\n\n// Feature-based structure:\n// src/\n//   features/\n//     auth/\n//       LoginForm.jsx\n//       AuthContext.jsx\n//       useAuth.js\n//     dashboard/\n//       Dashboard.jsx\n//       DashboardStats.jsx`,
      output: 'A dumb UserCard and a smart UserCardContainer that fetches data.',
      tasks: ['Separate a component into presentational and container.', 'Create a reusable presentational component.', 'Organize a feature folder with component, hook, and context.'],
      challenge: 'Refactor a monolithic component into smart/dumb pairs.',
      devFession: 'All my components fetched their own data AND rendered UI. Separating concerns made everything reusable.' },
  ]},

  // ─── MODULE 20: Testing Basics ────────────────
  { id: 320, emoji: '🧪', title: 'Testing Basics', tagline: 'Code with confidence.', lessons: [
    { id: 'r20-1', title: 'Testing React Components',
      difficulty: 'intermediate', duration: '12 min',
      concepts: ['Jest is the test runner — it runs your tests and reports results.', 'React Testing Library tests components the way users interact with them.', 'render() mounts a component, screen.getByText() finds elements, fireEvent simulates actions.', 'Test behavior, not implementation — don\'t test internal state, test what the user sees.'],
      code: `import { render, screen, fireEvent } from "@testing-library/react";\nimport Counter from "./Counter";\n\ntest("renders initial count", () => {\n    render(<Counter />);\n    expect(screen.getByText("Count: 0")).toBeInTheDocument();\n});\n\ntest("increments on click", () => {\n    render(<Counter />);\n    fireEvent.click(screen.getByText("+"));\n    expect(screen.getByText("Count: 1")).toBeInTheDocument();\n});\n\ntest("resets to zero", () => {\n    render(<Counter />);\n    fireEvent.click(screen.getByText("+"));\n    fireEvent.click(screen.getByText("Reset"));\n    expect(screen.getByText("Count: 0")).toBeInTheDocument();\n});`,
      output: 'Three passing tests for a Counter component.',
      tasks: ['Write a test that checks initial render output.', 'Write a test that simulates a button click.', 'Write a test that checks multiple interactions.'],
      challenge: 'Write tests for a TodoList: add item, mark complete, delete item.',
      devFession: 'I never wrote tests. Then a "small change" broke 3 features in production. Tests would have caught it in 2 seconds.' },
  ]},

  // ─── MODULE 21: Backend & Auth ────────────────
  { id: 321, emoji: '🔐', title: 'Backend Integration & Auth', tagline: 'Connect to real services.', lessons: [
    { id: 'r21-1', title: 'Supabase & Authentication',
      difficulty: 'intermediate', duration: '14 min',
      concepts: ['Supabase provides a Postgres database, authentication, and real-time features.', 'supabase.auth.signUp/signInWithPassword handle email auth.', 'supabase.auth.signInWithOAuth handles Google/GitHub login.', 'Row Level Security (RLS) ensures users only access their own data.', 'Store the Supabase URL and anon key in environment variables.'],
      code: `import { createClient } from "@supabase/supabase-js";\n\nconst supabase = createClient(\n    import.meta.env.VITE_SUPABASE_URL,\n    import.meta.env.VITE_SUPABASE_ANON_KEY\n);\n\n// Sign up\nasync function signUp(email, password) {\n    const { data, error } = await supabase.auth.signUp({\n        email, password\n    });\n}\n\n// Sign in\nasync function signIn(email, password) {\n    const { data, error } = await supabase.auth.signInWithPassword({\n        email, password\n    });\n}\n\n// Read data with RLS\nasync function getTodos() {\n    const { data } = await supabase\n        .from("todos")\n        .select("*");\n    return data;\n}`,
      output: 'Supabase auth and database queries in a React app.',
      tasks: ['Set up a Supabase project and get your keys.', 'Create a sign-up form that calls supabase.auth.signUp.', 'Query data from a Supabase table.'],
      challenge: 'Build a full auth flow: sign up, log in, protected routes, and log out.',
      devFession: 'I stored API keys in my JavaScript file and pushed to GitHub. Environment variables exist to prevent exactly this.' },
  ]},

  // ─── MODULE 22: Accessibility ─────────────────
  { id: 322, emoji: '♿', title: 'Accessibility in React', tagline: 'Build for everyone.', lessons: [
    { id: 'r22-1', title: 'A11y Best Practices in React',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['Use semantic HTML inside components — <button>, <nav>, <main>, not <div onClick>.', 'Every interactive element needs keyboard support — onKeyDown alongside onClick.', 'Use aria-label for icon buttons, aria-live for dynamic content.', 'jsx-a11y ESLint plugin catches accessibility issues during development.', 'Test with keyboard navigation and screen readers.'],
      code: `// BAD: div as button\n<div onClick={handleClick}>Click me</div>\n\n// GOOD: actual button\n<button onClick={handleClick}>Click me</button>\n\n// Icon button needs aria-label\n<button onClick={onClose} aria-label="Close menu">\n    <CloseIcon />\n</button>\n\n// Dynamic content needs aria-live\n<div aria-live="polite">\n    {message && <p>{message}</p>}\n</div>\n\n// Skip link for keyboard users\n<a href="#main" className="skip-link">\n    Skip to main content\n</a>`,
      output: 'Accessible buttons, ARIA labels, and live regions.',
      tasks: ['Replace a <div onClick> with a <button>.', 'Add aria-label to every icon button.', 'Navigate your app with Tab key only — fix any issues.'],
      challenge: 'Run an accessibility audit on your app and fix every issue found.',
      devFession: 'I used <div onClick> for buttons. Screen readers had no idea they were clickable. Use <button>. Always.' },
  ]},

  // ─── MODULE 23: Deployment ────────────────────
  { id: 323, emoji: '🚀', title: 'Deployment & DevTools', tagline: 'Ship it to the world.', lessons: [
    { id: 'r23-1', title: 'Deploying React Apps',
      difficulty: 'beginner', duration: '10 min',
      concepts: ['npm run build creates an optimized production build in the dist/ folder.', 'Netlify: drag dist/ folder or connect to GitHub for auto-deploys.', 'Vercel: connect GitHub repo, it detects React/Vite automatically.', 'Add environment variables in your hosting platform\'s settings, not in code.', 'Set up _redirects or netlify.toml for client-side routing.'],
      code: `// Build for production\n// npm run build\n\n// netlify.toml for React Router\n// [[redirects]]\n//   from = "/*"\n//   to = "/index.html"\n//   status = 200\n\n// Environment variables in Netlify/Vercel:\n// VITE_API_URL=https://api.example.com\n// VITE_SUPABASE_KEY=your-key-here\n\n// Access in code:\nconst apiUrl = import.meta.env.VITE_API_URL;`,
      output: 'A production build deployed to Netlify or Vercel.',
      tasks: ['Run npm run build and inspect the dist/ folder.', 'Deploy to Netlify using drag-and-drop.', 'Connect a GitHub repo for auto-deploys.', 'Add environment variables in the hosting settings.'],
      challenge: 'Deploy a React app to Netlify with environment variables and working client-side routing.',
      devFession: 'I deployed and every route except "/" gave a 404. You need redirect rules for client-side routing.' },
    { id: 'r23-2', title: 'React DevTools & Debugging',
      difficulty: 'beginner', duration: '8 min',
      concepts: ['React DevTools browser extension shows your component tree.', 'You can inspect props, state, hooks, and context for any component.', 'The Profiler tab shows which components re-rendered and how long they took.', 'Highlight updates mode visually shows re-renders in real-time.'],
      code: `// Install React DevTools extension for Chrome/Firefox\n// Then open DevTools → Components tab\n\n// What you can do:\n// - Click any component to see its props and state\n// - Edit state values in real-time\n// - See the component hierarchy\n// - Search for components by name\n\n// Profiler:\n// - Record a session\n// - See which components re-rendered\n// - Identify performance bottlenecks\n// - Find unnecessary re-renders`,
      output: 'The React DevTools showing component tree, state, and profiler.',
      tasks: ['Install React DevTools extension.', 'Inspect a component\'s props and state.', 'Use the Profiler to record and analyze re-renders.'],
      challenge: 'Use React DevTools to find and fix an unnecessary re-render in your app.',
      devFession: 'I console.logged everything to debug state. React DevTools shows you state, props, and context live. No console.logs needed.' },
  ]},

  // ─── MODULE 24: Capstone ──────────────────────
  { id: 324, emoji: '🏆', title: 'Build a Real Project', tagline: 'Everything comes together here.', lessons: [
    { id: 'r24-1', title: 'Your React Mastery Checklist',
      difficulty: 'beginner', duration: '15 min',
      content: 'If you can do everything on this list, you\'re job-ready.',
      concepts: ['Build components that are reusable and composable.', 'Manage state with useState, useReducer, and Context.', 'Fetch data with useEffect, handle loading and errors.', 'Route between pages with React Router.', 'Style dynamically with CSS Modules or Tailwind.', 'Deploy to Netlify or Vercel with environment variables.', 'Write accessible components with semantic HTML and ARIA.', 'Debug with React DevTools and write basic tests.'],
      code: `// Your project should include:\n// ✅ Multiple pages with React Router\n// ✅ Data fetching from an API or Supabase\n// ✅ Forms with controlled inputs and validation\n// ✅ Global state with Context (auth, theme)\n// ✅ Loading and error states\n// ✅ Responsive design\n// ✅ Accessible markup\n// ✅ Deployed and live\n\n// Project ideas:\n// 🌤️ Weather Dashboard (API + search + favorites)\n// 📝 Blog Platform (CRUD + auth + comments)\n// 🛒 E-commerce Store (cart + checkout + products)\n// 📊 Analytics Dashboard (charts + data + filters)`,
      output: 'A checklist for React mastery and project ideas.',
      tasks: ['Pick a project from the list (or create your own).', 'Build it using everything from this course.', 'Deploy it and add it to your portfolio.', 'Be able to explain every decision in an interview.'],
      challenge: 'Build and deploy a full React application that includes routing, data fetching, auth, and at least 5 components.',
      devFession: 'My first portfolio project was a counter app. It worked, but nobody hires you for a counter. Build something real.' },
  ]},
];
