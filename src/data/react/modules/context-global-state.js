export const module11 = {
    id: 311,
    emoji: '🌐',
    title: 'Context & Global State',
    tagline: 'Share data without prop drilling.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r11-1',
            prereqs: ['r10-2'],
            title: 'useContext & the Provider Pattern',
            difficulty: 'beginner',
            duration: '12 min',
            concepts: ['Context solves prop drilling — passing data through many layers of components.', 'createContext creates a context, Provider wraps components that need access.', 'useContext consumes the value in any child component.', 'Common uses: theme, auth state, user preferences, language.'],
            code: `import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("dark");
    const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

function Header() {
    const { theme, toggle } = useContext(ThemeContext);
    return (
        <header className={theme}>
            <button onClick={toggle}>Theme: {theme}</button>
        </header>
    );
}

function App() {
    return (
        <ThemeProvider>
            <Header />
        </ThemeProvider>
    );
}`,
            output: 'A theme toggle accessible from any component without prop drilling.',
            tasks: ['Create a context with createContext.', 'Wrap your app in a Provider.', 'Consume the context in a deeply nested component.'],
            challenge: 'Build an auth context with user state, login, and logout functions.',
            devFession: 'I passed props through 6 levels of components. Then I learned about Context. Six levels became zero.'
        },
        {
            id: 'r11-2',
            prereqs: ['r11-1'],
            title: 'Props vs State vs Context',
            difficulty: 'beginner',
            duration: '8 min',
            concepts: ['Props: data passed from parent to child. Read-only. For component configuration.', 'State: data owned by a component that changes over time. Triggers re-renders.', 'Context: data shared across many components without passing through every level.', 'Rule of thumb: start with props, add state when things change, add context when drilling gets painful.'],
            code: `// Props: configuration
<Button label="Submit" color="blue" />

// State: local interactive data
const [count, setCount] = useState(0);

// Context: global shared data
const { user } = useContext(AuthContext);

// Decision tree:
// Does only this component need it? → State
// Does a child need it? → Props
// Do many components across the tree need it? → Context`,
            output: 'A decision framework for choosing props, state, or context.',
            tasks: ['Identify 3 things that should be props, state, and context in a todo app.', 'Refactor a prop-drilled value into context.', 'Explain when state becomes context.'],
            challenge: 'Diagram the data flow of a shopping cart: which data is props, state, and context?',
            devFession: 'I put everything in context. Then every component re-rendered on every change. Context is for shared data, not all data.'
        }
    ]
};
