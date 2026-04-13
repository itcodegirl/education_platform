// ═══════════════════════════════════════════════
// MODULE 3: Side Effects & Data Fetching (3 lessons)
// useEffect deep dive → API fetching → Custom hooks
// ═══════════════════════════════════════════════

export const module9 = {
  id: 309,
  emoji: '🔄',
  title: 'Side Effects & Data Fetching',
  tagline: 'Master useEffect, fetch data from APIs, and build custom hooks.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'r9-1', title: 'useEffect Deep Dive', prereqs: ['r19-9'], difficulty: 'intermediate', duration: '30 min',
      concepts: [
        'Side effects: operations that reach outside your component — API calls, timers, subscriptions, DOM manipulation, localStorage.',
        'useEffect dependency array: [] = mount only. [x] = when x changes. No array = every render (usually a bug).',
        'Cleanup functions: return a function from useEffect to prevent memory leaks. Runs on unmount AND before re-running the effect.',
        'Avoiding infinite loops: never update state that\'s in the dependency array without a condition. useEffect + setState + that state in deps = infinite loop.',
      ],
      code: `// Effect with cleanup and dependencies\nfunction OnlineStatus() {\n    const [isOnline, setIsOnline] = React.useState(true);\n\n    React.useEffect(() => {\n        const handleOnline = () => setIsOnline(true);\n        const handleOffline = () => setIsOnline(false);\n        \n        window.addEventListener('online', handleOnline);\n        window.addEventListener('offline', handleOffline);\n        \n        // Cleanup: remove listeners on unmount\n        return () => {\n            window.removeEventListener('online', handleOnline);\n            window.removeEventListener('offline', handleOffline);\n        };\n    }, []); // [] = set up once on mount\n\n    return <span>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>;\n}`,
      output: 'Online/offline detector with proper cleanup. The event listeners are removed when the component unmounts.',
      tasks: ['Build an online/offline status detector with cleanup', 'Update document title based on state changes', 'Create a timer that starts on mount and cleans up on unmount', 'Build a window resize tracker with cleanup'],
      challenge: 'Document Title + Online Status: update title with unread count, detect online/offline, show indicator, proper cleanup of ALL listeners.',
      devFession: 'I forgot the cleanup function on a WebSocket connection. Every time the component re-mounted, it opened a NEW connection without closing the old one. 47 open connections later, my browser crashed.',
    },
    {
      id: 'r9-2', title: 'Fetching Data from APIs', prereqs: ['r9-1'], difficulty: 'intermediate', duration: '35 min',
      concepts: [
        'Fetch pattern: useEffect with async function inside (can\'t make useEffect itself async). Loading → success/error state machine.',
        'AbortController: cancel in-flight requests when component unmounts or dependencies change. Prevents "set state on unmounted component" warnings.',
        'Loading states: always show loading UI while fetching. Never render empty/stale data during a fetch.',
        'Error handling: wrap fetch in try/catch. Show error UI with retry button. Don\'t silently fail.',
      ],
      code: `function UserProfile({ userId }) {\n    const [user, setUser] = React.useState(null);\n    const [loading, setLoading] = React.useState(true);\n    const [error, setError] = React.useState(null);\n\n    React.useEffect(() => {\n        const controller = new AbortController();\n        \n        async function fetchUser() {\n            setLoading(true);\n            setError(null);\n            try {\n                const res = await fetch(\`/api/users/\${userId}\`, {\n                    signal: controller.signal\n                });\n                if (!res.ok) throw new Error('User not found');\n                const data = await res.json();\n                setUser(data);\n            } catch (err) {\n                if (err.name !== 'AbortError') {\n                    setError(err.message);\n                }\n            } finally {\n                setLoading(false);\n            }\n        }\n        \n        fetchUser();\n        return () => controller.abort(); // Cancel on cleanup\n    }, [userId]); // Re-fetch when userId changes\n\n    if (loading) return <p>Loading...</p>;\n    if (error) return <p>Error: {error}</p>;\n    return <h1>{user.name}</h1>;\n}`,
      output: 'Professional data fetching with loading states, error handling, and request cancellation.',
      tasks: ['Fetch data on mount with loading/error states', 'Re-fetch when a prop changes (userId)', 'Cancel requests with AbortController on cleanup', 'Build a search with debounced API calls'],
      challenge: 'Advanced GitHub User Finder: search by username, show profile + repos, loading states for both calls, debounced auto-search, cancel in-flight requests.',
      devFession: 'I built a search that fired an API call on every keystroke. Typing "react" made 5 API calls. With debounce, it makes 1. My API bill dropped 80%.',
    },
    {
      id: 'r9-3', title: 'Custom Hooks', prereqs: ['r9-2'], difficulty: 'intermediate', duration: '30 min',
      concepts: [
        'Custom hooks: functions starting with "use" that extract reusable stateful logic. They can use useState, useEffect, and other hooks.',
        'Rules of hooks: only call at the top level (not in loops/conditions). Only call from React functions or custom hooks.',
        'useFetch: encapsulates the fetch-loading-error pattern into one reusable hook. Call it anywhere.',
        'useLocalStorage: useState but synced to localStorage. Data persists across page refreshes.',
      ],
      code: `// useFetch — reusable data fetching hook\nfunction useFetch(url) {\n    const [data, setData] = React.useState(null);\n    const [loading, setLoading] = React.useState(true);\n    const [error, setError] = React.useState(null);\n\n    React.useEffect(() => {\n        const controller = new AbortController();\n        setLoading(true);\n        \n        fetch(url, { signal: controller.signal })\n            .then(res => res.json())\n            .then(data => { setData(data); setLoading(false); })\n            .catch(err => {\n                if (err.name !== 'AbortError') {\n                    setError(err.message); setLoading(false);\n                }\n            });\n        \n        return () => controller.abort();\n    }, [url]);\n\n    return { data, loading, error };\n}\n\n// Usage — one line to fetch anything!\nfunction UserList() {\n    const { data: users, loading, error } = useFetch('/api/users');\n    if (loading) return <p>Loading...</p>;\n    if (error) return <p>Error: {error}</p>;\n    return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n}`,
      output: 'useFetch encapsulates all fetch logic. One line to fetch data with loading/error handling!',
      tasks: ['Extract fetch logic into a useFetch custom hook', 'Build a useLocalStorage hook that syncs state', 'Create a useDebounce hook for search inputs', 'Build a useWindowSize hook for responsive layouts'],
      challenge: 'Build a Custom Hooks Library: useDebounce, useToggle, useWindowSize, usePrevious, useOnClickOutside. Each hook tested with a demo component.',
      devFession: 'I copied the same 30-line fetch pattern into 12 components. Then I learned custom hooks and replaced all 12 with a one-liner: useFetch(url). 360 lines → 12.',
    },
  ],
};
