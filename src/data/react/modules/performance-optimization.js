export const module16 = {
    id: 316,
    emoji: '⚡',
    title: 'Performance & Optimization',
    tagline: 'Make it fast. Keep it fast.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r16-1',
            prereqs: ['r15-1'],
            title: 'React.memo, useMemo & useCallback',
            difficulty: 'intermediate',
            duration: '14 min',
            concepts: [
                'React re-renders a component when its state or props change.',
                'React.memo wraps a component to skip re-renders if props haven\'t changed.',
                'useMemo caches an expensive calculation — only recalculates when dependencies change.',
                'useCallback caches a function reference — prevents child re-renders from new function references.',
                'Don\'t optimize prematurely — only use these when you notice performance issues.'
            ],
            code: `import { memo, useMemo, useCallback } from "react";

// React.memo: skip re-render if props are same
const ExpensiveList = memo(function ExpensiveList({ items }) {
    console.log("List rendered");
    return items.map(i => <p key={i.id}>{i.name}</p>);
});

function App() {
    const [count, setCount] = useState(0);
    const [items] = useState([{ id: 1, name: "A" }, { id: 2, name: "B" }]);

    // useMemo: cache calculation
    const total = useMemo(() => {
        return items.reduce((sum, i) => sum + i.price, 0);
    }, [items]);

    // useCallback: cache function
    const handleClick = useCallback(() => {
        console.log("clicked");
    }, []);

    return (
        <div>
            <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
            <ExpensiveList items={items} onClick={handleClick} />
        </div>
    );
}`,
            output: 'ExpensiveList only re-renders when items change, not when count changes.',
            tasks: ['Wrap a component in React.memo.', 'Use useMemo to cache a filtered list.', 'Use useCallback on a function passed to a memoized child.'],
            challenge: 'Identify a re-render issue in a component and fix it with memo/useMemo/useCallback.',
            devFession: 'I wrapped everything in React.memo. It made things slower because the comparison itself costs performance. Only memo what needs it.'
        }
    ]
};
