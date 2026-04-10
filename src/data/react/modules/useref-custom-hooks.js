export const module10 = {
    id: 310,
    emoji: '🪝',
    title: 'useRef & Custom Hooks',
    tagline: 'Advanced tools for real apps.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r10-1',
            prereqs: ['r9-1'],
            title: 'useRef',
            difficulty: 'beginner',
            duration: '8 min',
            concepts: ['useRef stores a mutable value that persists across renders WITHOUT causing re-renders.', 'Common use: reference DOM elements directly (like focusing an input).', 'Also used for: storing previous values, timers, and any mutable data.', 'ref.current holds the value — it doesn\'t trigger re-renders when changed.'],
            code: `import { useRef, useEffect } from "react";

function SearchBar() {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current.focus(); // auto-focus on mount
    }, []);

    return <input ref={inputRef} placeholder="Search..." />;
}

// Storing previous value
function Counter() {
    const [count, setCount] = useState(0);
    const prevCount = useRef(0);

    useEffect(() => {
        prevCount.current = count;
    }, [count]);

    return <p>Now: {count}, Before: {prevCount.current}</p>;
}`,
            output: 'An auto-focused input and a counter that tracks its previous value.',
            tasks: ['Use useRef to auto-focus an input on mount.', 'Store a previous value with useRef.', 'Explain why useRef doesn\'t cause re-renders.'],
            challenge: 'Build a stopwatch using useRef to store the interval ID.',
            devFession: 'I used useState to store a timer ID. Every update re-rendered the component. useRef stores values silently.'
        },
        {
            id: 'r10-2',
            prereqs: ['r10-1'],
            title: 'Custom Hooks',
            difficulty: 'intermediate',
            duration: '12 min',
            concepts: ['Custom hooks extract reusable logic into a function that starts with "use".', 'They can use any built-in hook inside (useState, useEffect, etc.).', 'Common custom hooks: useFetch, useLocalStorage, useDebounce, useToggle.', 'Custom hooks make components cleaner by moving complex logic out.'],
            code: `// useFetch — reusable data fetching
function useFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch(url)
            .then(res => res.json())
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [url]);

    return { data, loading, error };
}

// Usage — clean component!
function UserList() {
    const { data: users, loading, error } = useFetch("/api/users");
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error!</p>;
    return users.map(u => <p key={u.id}>{u.name}</p>);
}`,
            output: 'A reusable useFetch hook used in a clean component.',
            tasks: ['Create a useToggle custom hook.', 'Create a useLocalStorage hook that syncs state to localStorage.', 'Refactor a component to use a custom hook.'],
            challenge: 'Build a useFetch hook and use it in 3 different components.',
            devFession: 'I copy-pasted the same fetch logic into 7 components. Custom hooks let you write it once and reuse everywhere.'
        }
    ]
};
