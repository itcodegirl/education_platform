export const module7 = {
    id: 307,
    emoji: '📋',
    title: 'Conditional Rendering & Lists',
    tagline: 'Show, hide, and repeat.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r7-1',
            prereqs: ['r6-3'],
            title: 'Conditional Rendering',
            difficulty: 'beginner',
            duration: '8 min',
            concepts: ['Ternary: {condition ? <A /> : <B />} — show one or the other.', 'Logical AND: {condition && <A />} — show or hide.', 'Early return: if (!data) return <Loading /> — guard clauses.', 'Never use if/else directly inside JSX — use ternary or && instead.'],
            code: `function Dashboard({ user, isLoading }) {
    if (isLoading) return <p>Loading...</p>;
    if (!user) return <p>Please log in.</p>;

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            {user.isAdmin && <button>Admin Panel</button>}
            <p>Role: {user.isAdmin ? "Admin" : "User"}</p>
        </div>
    );
}`,
            output: 'Loading state, login prompt, or dashboard — depending on conditions.',
            tasks: ['Use a ternary to show different text based on a boolean.', 'Use && to conditionally render a component.', 'Use an early return for a loading state.'],
            challenge: 'Build a login/dashboard view that switches based on authentication state.',
            devFession: 'I wrote if/else inside JSX. It broke. Use ternary or && inside JSX, or early returns above the return statement.'
        },
        {
            id: 'r7-2',
            prereqs: ['r7-1'],
            title: 'Lists & Keys',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['Use .map() to render an array of items as JSX elements.', 'Every list item MUST have a unique key prop — React uses it to track changes.', 'Keys should be stable IDs, not array indexes (indexes cause bugs with reordering).', 'Without keys, React can\'t tell which items changed, were added, or removed.'],
            code: `function TodoList({ todos }) {
    return (
        <ul>
            {todos.map(todo => (
                <li key={todo.id}
                    className={todo.done ? "done" : ""}>
                    {todo.text}
                </li>
            ))}
        </ul>
    );
}

// Usage:
const todos = [
    { id: 1, text: "Learn React", done: true },
    { id: 2, text: "Build a project", done: false },
    { id: 3, text: "Get hired", done: false },
];`,
            output: 'A rendered list of todos with unique keys and conditional styling.',
            tasks: ['Render an array of names as a list.', 'Add unique key props to each list item.', 'Style completed items differently.'],
            challenge: 'Build a contact list that renders from an array of objects with name, email, and phone.',
            devFession: 'I used array index as key, reordered items, and React recycled the wrong elements. Use unique IDs.'
        }
    ]
};
