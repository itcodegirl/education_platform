export const module20 = {
    id: 320,
    emoji: '🧪',
    title: 'Testing Basics',
    tagline: 'Code with confidence.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r20-1',
            prereqs: ['r19-1'],
            title: 'Testing React Components',
            difficulty: 'intermediate',
            duration: '12 min',
            concepts: ['Jest is the test runner — it runs your tests and reports results.', 'React Testing Library tests components the way users interact with them.', 'render() mounts a component, screen.getByText() finds elements, fireEvent simulates actions.', 'Test behavior, not implementation — don\'t test internal state, test what the user sees.'],
            code: `import { render, screen, fireEvent } from "@testing-library/react";
import Counter from "./Counter";

test("renders initial count", () => {
    render(<Counter />);
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
});

test("increments on click", () => {
    render(<Counter />);
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
});

test("resets to zero", () => {
    render(<Counter />);
    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
});`,
            output: 'Three passing tests for a Counter component.',
            tasks: ['Write a test that checks initial render output.', 'Write a test that simulates a button click.', 'Write a test that checks multiple interactions.'],
            challenge: 'Write tests for a TodoList: add item, mark complete, delete item.',
            devFession: 'I never wrote tests. Then a "small change" broke 3 features in production. Tests would have caught it in 2 seconds.'
        }
    ]
};
