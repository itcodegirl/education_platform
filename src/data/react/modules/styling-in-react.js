export const module12 = {
    id: 312,
    emoji: '🎨',
    title: 'Styling in React',
    tagline: 'Make it beautiful.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r12-1',
            prereqs: ['r11-2'],
            title: 'CSS Approaches & Dynamic Styling',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: [
                'Regular CSS files: import "./styles.css" — simple but global.',
                'CSS Modules: import styles from "./Button.module.css" — scoped to component.',
                'Inline styles: style={{ color: "red" }} — object syntax, camelCase properties.',
                'Tailwind CSS: utility classes directly in JSX — fast and popular.',
                'Dynamic classes: className={isActive ? "active" : ""}.'
            ],
            code: `// CSS Modules
import styles from "./Button.module.css";
function Button({ variant }) {
    return <button className={styles[variant]}>Click</button>;
}

// Dynamic classes
function Tab({ label, isActive }) {
    return (
        <button className={\`tab \${isActive ? "active" : ""}\`}>
            {label}
        </button>
    );
}

// Inline (useful for dynamic values)
function ProgressBar({ percent }) {
    return (
        <div className="bar">
            <div style={{ width: \`\${percent}%\`,
                          background: percent > 80 ? "green" : "orange" }} />
        </div>
    );
}`,
            output: 'CSS Modules, dynamic classes, and inline styles for a progress bar.',
            tasks: ['Import a CSS file and apply classes.', 'Use a CSS Module for scoped styles.', 'Apply dynamic inline styles based on a prop.'],
            challenge: 'Build a button component with "primary", "secondary", and "danger" variants using dynamic classes.',
            devFession: 'I used inline styles for everything. The components were unreadable. CSS files or modules are almost always better.'
        }
    ]
};
