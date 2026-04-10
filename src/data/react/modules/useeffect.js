export const module9 = {
    id: 309,
    emoji: '🔁',
    title: 'useEffect',
    tagline: 'Side effects, the React way.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r9-1',
            prereqs: ['r8-1'],
            title: 'Side Effects & the Dependency Array',
            difficulty: 'beginner',
            duration: '14 min',
            concepts: [
                'useEffect runs code AFTER render — for API calls, timers, subscriptions.',
                'Empty dependency array [] = runs once on mount (like componentDidMount).',
                'With dependencies [x, y] = re-runs when x or y changes.',
                'No array = runs after EVERY render (usually a mistake).',
                'Return a cleanup function to stop timers, unsubscribe, etc.'
            ],
            code: `import { useState, useEffect } from "react";

function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(\`https://api.example.com/users/\${userId}\`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setLoading(false);
            });
    }, [userId]); // re-fetches when userId changes

    // Cleanup example
    useEffect(() => {
        const timer = setInterval(() => console.log("tick"), 1000);
        return () => clearInterval(timer); // cleanup
    }, []);

    if (loading) return <p>Loading...</p>;
    return <h1>{user?.name}</h1>;
}`,
            output: 'A user profile that fetches data on mount and when userId changes.',
            tasks: ['Fetch data in a useEffect with an empty dependency array.', 'Add a dependency that triggers a re-fetch.', 'Add a cleanup function that clears a timer.'],
            challenge: 'Build a component that fetches and displays a random joke on mount, with a "New Joke" button.',
            devFession: 'I forgot the dependency array and my useEffect ran infinitely, sending 10,000 API requests in 5 seconds.'
        }
    ]
};
