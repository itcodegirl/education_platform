export const module18 = {
    id: 318,
    emoji: '🧬',
    title: 'Advanced Patterns',
    tagline: 'Code splitting, portals, and HOCs.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r18-1',
            prereqs: ['r17-1'],
            title: 'Code Splitting & Lazy Loading',
            difficulty: 'intermediate',
            duration: '10 min',
            concepts: ['React.lazy loads components only when needed — reduces initial bundle size.', 'Suspense wraps lazy components and shows a fallback while loading.', 'Useful for routes, modals, and heavy components that aren\'t needed immediately.'],
            code: `import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));
const AdminPanel = lazy(() => import("./AdminPanel"));

function App() {
    return (
        <div>
            <Suspense fallback={<p>Loading chart...</p>}>
                <HeavyChart />
            </Suspense>

            {isAdmin && (
                <Suspense fallback={<p>Loading admin...</p>}>
                    <AdminPanel />
                </Suspense>
            )}
        </div>
    );
}`,
            output: 'Components loaded on demand with loading fallbacks.',
            tasks: ['Lazy load a component with React.lazy.', 'Add a Suspense boundary with a loading message.', 'Lazy load route components.'],
            challenge: 'Split your app\'s routes into lazy-loaded chunks.',
            devFession: 'My bundle was 2MB. Users waited 8 seconds to load. Lazy loading cut it to 400KB initial load.'
        },
        {
            id: 'r18-2',
            prereqs: ['r18-1'],
            title: 'Portals & Component Patterns',
            difficulty: 'intermediate',
            duration: '10 min',
            concepts: ['Portals render children outside the parent DOM hierarchy — useful for modals and tooltips.', 'createPortal(jsx, domNode) renders into any DOM node, even outside #root.', 'Higher-Order Components (HOCs) wrap components to add reusable behavior.', 'Render props pass a function as children for flexible composition.'],
            code: `import { createPortal } from "react-dom";

// Portal: renders modal outside the component tree
function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                {children}
                <button onClick={onClose}>Close</button>
            </div>
        </div>,
        document.getElementById("modal-root")
    );
}

// HOC: adds loading behavior
function withLoading(Component) {
    return function WithLoading({ isLoading, ...props }) {
        if (isLoading) return <p>Loading...</p>;
        return <Component {...props} />;
    };
}
const UserListWithLoading = withLoading(UserList);`,
            output: 'A portal-based modal and a higher-order component for loading states.',
            tasks: ['Create a modal using createPortal.', 'Add a <div id="modal-root"> to your index.html.', 'Write a simple HOC that adds a wrapper behavior.'],
            challenge: 'Build a reusable Modal component with portal rendering and backdrop click to close.',
            devFession: 'I rendered a modal inside a div with overflow:hidden. It got clipped. Portals render outside the parent tree.'
        }
    ]
};
