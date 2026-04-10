export const module14 = {
    id: 314,
    emoji: '📡',
    title: 'Data Fetching & Async Patterns',
    tagline: 'Connect your app to the world.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r14-1',
            prereqs: ['r13-1'],
            title: 'Fetching, Loading & Error States',
            difficulty: 'beginner',
            duration: '14 min',
            concepts: ['Fetch data inside useEffect — never directly in the component body.', 'Track three states: data, loading, error — handle all three in JSX.', 'Use async/await inside useEffect with an inner async function.', 'Cancel ongoing requests when the component unmounts (AbortController).'],
            code: `function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        async function fetchUsers() {
            try {
                const res = await fetch(
                    "https://jsonplaceholder.typicode.com/users",
                    { signal: controller.signal }
                );
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
        return () => controller.abort();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    return users.map(u => <p key={u.id}>{u.name}</p>);
}`,
            output: 'A user list with loading spinner, error handling, and request cleanup.',
            tasks: ['Fetch data with loading and error states.', 'Display different UI for loading, error, and success.', 'Add AbortController cleanup.'],
            challenge: 'Build a search page that fetches results as the user types (with debouncing).',
            devFession: 'I forgot to handle the loading state and the page showed nothing for 2 seconds. Users thought it was broken.'
        }
    ]
};
