export const module4 = {
    id: 304,
    emoji: '📨',
    title: 'Props',
    tagline: 'Pass data down, keep components flexible.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r4-1',
            prereqs: ['r3-1'],
            title: 'Props & Data Flow',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['Props are how parent components pass data to children.', 'Props are read-only — a child can never modify its own props.', 'Destructure props in the function signature for cleaner code.', 'Data flows ONE direction in React: parent → child (unidirectional).'],
            code: `function Badge({ label, color }) {
    return (
        <span style={{ background: color, padding: "4px 12px",
                        borderRadius: "12px", color: "#fff" }}>
            {label}
        </span>
    );
}

function UserCard({ name, role, isActive }) {
    return (
        <div className="card">
            <h3>{name}</h3>
            <p>{role}</p>
            <Badge
                label={isActive ? "Active" : "Inactive"}
                color={isActive ? "#4ecdc4" : "#888"}
            />
        </div>
    );
}

// Usage:
<UserCard name="Jenna" role="Developer" isActive={true} />`,
            output: 'A user card with a dynamic badge — all data passed via props.',
            tasks: ['Create a component that accepts 3 props.', 'Pass different values to render different variations.', 'Use destructuring to access props cleanly.'],
            challenge: 'Build a ProductCard component that takes name, price, image, and inStock props.',
            devFession: 'I tried to change a prop inside a child component. React said no. Props are read-only. Use state if you need to change things.'
        }
    ]
};
