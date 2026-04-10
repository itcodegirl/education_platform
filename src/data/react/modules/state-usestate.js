export const module6 = {
    id: 306,
    emoji: '🔄',
    title: 'State & useState',
    tagline: 'Data that changes. UI that reacts.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r6-1',
            prereqs: ['r5-1'],
            title: 'Introduction to State',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['State is data that can change over time — when it changes, React re-renders.', 'useState returns [value, setter] — always destructure both.', 'Never modify state directly — always use the setter function.', 'State is LOCAL to the component — each instance has its own state.'],
            code: `import { useState } from "react";

function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(count - 1)}>-</button>
            <button onClick={() => setCount(0)}>Reset</button>
        </div>
    );
}`,
            output: 'A counter that increments, decrements, and resets.',
            tasks: ['Create a counter with useState.', 'Add a reset button.', 'Create a toggle that switches between "ON" and "OFF".'],
            challenge: 'Build a light/dark mode toggle using useState.',
            devFession: 'I set state directly: count = count + 1. Nothing happened. React only re-renders when you use the setter.'
        },
        {
            id: 'r6-2',
            prereqs: ['r6-1'],
            title: 'State with Objects & Arrays',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['When state is an object, spread the old state and override what changed.', 'When state is an array, use map/filter/spread — never push/pop directly.', 'React uses reference comparison — you must create a NEW object/array for it to detect changes.', 'Functional updates (prev => ...) are safer when state depends on previous state.'],
            code: `// Object state
const [user, setUser] = useState({ name: "", email: "" });
setUser(prev => ({ ...prev, name: "Jenna" }));

// Array state
const [todos, setTodos] = useState([]);

// Add
setTodos(prev => [...prev, { id: Date.now(), text: "New" }]);

// Remove
setTodos(prev => prev.filter(t => t.id !== idToRemove));

// Update one item
setTodos(prev => prev.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
));`,
            output: 'Object and array state updated immutably with spread and map/filter.',
            tasks: ['Create a form that updates an object in state.', 'Build a list where you can add and remove items.', 'Toggle a "done" property on a list item.'],
            challenge: 'Build a mini todo app with add, delete, and toggle complete.',
            devFession: 'I did todos.push(newItem) and the list didn\'t update. Array.push mutates — React needs a new array to re-render.'
        },
        {
            id: 'r6-3',
            prereqs: ['r6-2'],
            title: 'Lifting State Up',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['When two sibling components need the same data, move state to their shared parent.', 'The parent owns the state and passes it down as props.', 'Children communicate UP by calling functions passed as props.', 'This is React\'s core data flow pattern.'],
            code: `function App() {
    const [theme, setTheme] = useState("light");
    return (
        <div className={theme}>
            <ThemeToggle theme={theme} onToggle={() =>
                setTheme(t => t === "light" ? "dark" : "light")
            } />
            <Content theme={theme} />
        </div>
    );
}

function ThemeToggle({ theme, onToggle }) {
    return <button onClick={onToggle}>Current: {theme}</button>;
}

function Content({ theme }) {
    return <p>Theme is: {theme}</p>;
}`,
            output: 'Two siblings sharing state through their parent.',
            tasks: ['Move state from a child to a parent component.', 'Pass state down as props and a setter function.', 'Have a child trigger a state change in the parent.'],
            challenge: 'Build a temperature converter where Celsius and Fahrenheit inputs stay in sync via lifted state.',
            devFession: 'I tried to share state between siblings by importing it. That\'s not how React works. State lives in the closest common parent.'
        }
    ]
};
