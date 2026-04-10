export const module24 = {
    id: 324,
    emoji: '🏆',
    title: 'Build a Real Project',
    tagline: 'Everything comes together here.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r24-1',
            prereqs: ['r23-2'],
            title: 'Your React Mastery Checklist',
            difficulty: 'beginner',
            duration: '15 min',
            content: 'If you can do everything on this list, you\'re job-ready.',
            concepts: [
                'Build components that are reusable and composable.',
                'Manage state with useState, useReducer, and Context.',
                'Fetch data with useEffect, handle loading and errors.',
                'Route between pages with React Router.',
                'Style dynamically with CSS Modules or Tailwind.',
                'Deploy to Netlify or Vercel with environment variables.',
                'Write accessible components with semantic HTML and ARIA.',
                'Debug with React DevTools and write basic tests.'
            ],
            code: `// Your project should include:
// ✅ Multiple pages with React Router
// ✅ Data fetching from an API or Supabase
// ✅ Forms with controlled inputs and validation
// ✅ Global state with Context (auth, theme)
// ✅ Loading and error states
// ✅ Responsive design
// ✅ Accessible markup
// ✅ Deployed and live

// Project ideas:
// 🌤️ Weather Dashboard (API + search + favorites)
// 📝 Blog Platform (CRUD + auth + comments)
// 🛒 E-commerce Store (cart + checkout + products)
// 📊 Analytics Dashboard (charts + data + filters)`,
            output: 'A checklist for React mastery and project ideas.',
            tasks: ['Pick a project from the list (or create your own).', 'Build it using everything from this course.', 'Deploy it and add it to your portfolio.', 'Be able to explain every decision in an interview.'],
            challenge: 'Build and deploy a full React application that includes routing, data fetching, auth, and at least 5 components.',
            devFession: 'My first portfolio project was a counter app. It worked, but nobody hires you for a counter. Build something real.'
        }
    ]
};
