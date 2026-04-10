export const module3 = {
    id: 303,
    emoji: '🧱',
    title: 'Components',
    tagline: 'Small pieces. Big apps.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r3-1',
            prereqs: ['r2-1'],
            title: 'Creating & Composing Components',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['Components are functions that return JSX — they\'re reusable UI pieces.', 'Component names MUST start with a capital letter (PascalCase).', 'Composition: build complex UIs by nesting components inside each other.', 'Each component should do ONE thing well — single responsibility.'],
            code: `function Header() {
    return <header><h1>CodeHerWay</h1></header>;
}

function Card({ title, children }) {
    return (
        <div className="card">
            <h3>{title}</h3>
            {children}
        </div>
    );
}

function App() {
    return (
        <div>
            <Header />
            <Card title="Lesson 1">
                <p>Learn components!</p>
            </Card>
            <Card title="Lesson 2">
                <p>Learn props!</p>
            </Card>
        </div>
    );
}`,
            output: 'A header and two reusable card components composed together.',
            tasks: ['Create 3 small components.', 'Compose them inside an App component.', 'Use the children prop to pass content into a wrapper component.'],
            challenge: 'Build a page layout with Header, Sidebar, Main, and Footer — each as a separate component.',
            devFession: 'I put everything in one giant App component. 500 lines. It worked until I needed to change anything.'
        }
    ]
};
