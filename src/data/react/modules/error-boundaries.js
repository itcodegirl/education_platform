export const module17 = {
    id: 317,
    emoji: '🛡️',
    title: 'Error Boundaries',
    tagline: 'Apps that don\'t crash.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r17-1',
            prereqs: ['r16-1'],
            title: 'Error Boundaries & Fallback UI',
            difficulty: 'intermediate',
            duration: '10 min',
            concepts: ['Error boundaries catch JavaScript errors in child components during rendering.', 'They display a fallback UI instead of crashing the entire app.', 'Error boundaries must be class components (no hook equivalent yet).', 'Use react-error-boundary library for a simpler, modern approach.'],
            code: `import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div className="error">
            <h2>Something went wrong</h2>
            <p>{error.message}</p>
            <button onClick={resetErrorBoundary}>Try Again</button>
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Dashboard />
        </ErrorBoundary>
    );
}

// This component might throw
function Dashboard() {
    const [data] = useFetch("/api/data");
    if (!data) throw new Error("Failed to load");
    return <h1>{data.title}</h1>;
}`,
            output: 'A dashboard that shows a friendly error message instead of crashing.',
            tasks: ['Install react-error-boundary.', 'Wrap a component in an ErrorBoundary.', 'Create a custom fallback component with a retry button.'],
            challenge: 'Add error boundaries around 3 sections of your app so one failure doesn\'t crash everything.',
            devFession: 'My whole app white-screened because one component threw an error. Error boundaries contain the blast radius.'
        }
    ]
};
