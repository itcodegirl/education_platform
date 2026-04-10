export const module23 = {
    id: 323,
    emoji: '🚀',
    title: 'Deployment & DevTools',
    tagline: 'Ship it to the world.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r23-1',
            prereqs: ['r22-1'],
            title: 'Deploying React Apps',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: [
                'npm run build creates an optimized production build in the dist/ folder.',
                'Netlify: drag dist/ folder or connect to GitHub for auto-deploys.',
                'Vercel: connect GitHub repo, it detects React/Vite automatically.',
                'Add environment variables in your hosting platform\'s settings, not in code.',
                'Set up _redirects or netlify.toml for client-side routing.'
            ],
            code: `// Build for production
// npm run build

// netlify.toml for React Router
// [[redirects]]
//   from = "/*"
//   to = "/index.html"
//   status = 200

// Environment variables in Netlify/Vercel:
// VITE_API_URL=https://api.example.com
// VITE_SUPABASE_KEY=your-key-here

// Access in code:
const apiUrl = import.meta.env.VITE_API_URL;`,
            output: 'A production build deployed to Netlify or Vercel.',
            tasks: ['Run npm run build and inspect the dist/ folder.', 'Deploy to Netlify using drag-and-drop.', 'Connect a GitHub repo for auto-deploys.', 'Add environment variables in the hosting settings.'],
            challenge: 'Deploy a React app to Netlify with environment variables and working client-side routing.',
            devFession: 'I deployed and every route except "/" gave a 404. You need redirect rules for client-side routing.'
        },
        {
            id: 'r23-2',
            prereqs: ['r23-1'],
            title: 'React DevTools & Debugging',
            difficulty: 'beginner',
            duration: '8 min',
            concepts: ['React DevTools browser extension shows your component tree.', 'You can inspect props, state, hooks, and context for any component.', 'The Profiler tab shows which components re-rendered and how long they took.', 'Highlight updates mode visually shows re-renders in real-time.'],
            code: `// Install React DevTools extension for Chrome/Firefox
// Then open DevTools → Components tab

// What you can do:
// - Click any component to see its props and state
// - Edit state values in real-time
// - See the component hierarchy
// - Search for components by name

// Profiler:
// - Record a session
// - See which components re-rendered
// - Identify performance bottlenecks
// - Find unnecessary re-renders`,
            output: 'The React DevTools showing component tree, state, and profiler.',
            tasks: ['Install React DevTools extension.', 'Inspect a component\'s props and state.', 'Use the Profiler to record and analyze re-renders.'],
            challenge: 'Use React DevTools to find and fix an unnecessary re-render in your app.',
            devFession: 'I console.logged everything to debug state. React DevTools shows you state, props, and context live. No console.logs needed.'
        }
    ]
};
