export const module19 = {
    id: 319,
    emoji: '🏛️',
    title: 'Component Design Patterns',
    tagline: 'Architect components like a pro.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r19-1',
            prereqs: ['r18-2'],
            title: 'Smart vs Dumb Components',
            difficulty: 'intermediate',
            duration: '10 min',
            concepts: ['Presentational (dumb) components: just render UI from props — no state, no logic.', 'Container (smart) components: manage state, fetch data, handle logic.', 'This separation makes components more reusable and testable.', 'Feature-based folder structure: group by feature, not by type.'],
            code: `// Presentational (dumb) — just renders
function UserCard({ name, email, avatar }) {
    return (
        <div className="card">
            <img src={avatar} alt={name} />
            <h3>{name}</h3>
            <p>{email}</p>
        </div>
    );
}

// Container (smart) — manages data
function UserCardContainer({ userId }) {
    const { data: user, loading } = useFetch(\`/api/users/\${userId}\`);
    if (loading) return <Skeleton />;
    return <UserCard {...user} />;
}

// Feature-based structure:
// src/
//   features/
//     auth/
//       LoginForm.jsx
//       AuthContext.jsx
//       useAuth.js
//     dashboard/
//       Dashboard.jsx
//       DashboardStats.jsx`,
            output: 'A dumb UserCard and a smart UserCardContainer that fetches data.',
            tasks: ['Separate a component into presentational and container.', 'Create a reusable presentational component.', 'Organize a feature folder with component, hook, and context.'],
            challenge: 'Refactor a monolithic component into smart/dumb pairs.',
            devFession: 'All my components fetched their own data AND rendered UI. Separating concerns made everything reusable.'
        }
    ]
};
