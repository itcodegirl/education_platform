export const module13 = {
    id: 313,
    emoji: '🧭',
    title: 'React Router',
    tagline: 'Multiple pages, one app.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r13-1',
            prereqs: ['r12-1'],
            title: 'Client-Side Routing',
            difficulty: 'beginner',
            duration: '14 min',
            concepts: ['React Router enables multi-page navigation without full page reloads.', 'BrowserRouter wraps your app, Routes contains Route definitions.', 'Link replaces <a> tags for navigation — no page refresh.', 'useParams reads URL parameters, useNavigate programmatically navigates.'],
            code: `import { BrowserRouter, Routes, Route, Link,
         useParams, useNavigate } from "react-router-dom";

function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/user/42">User 42</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    return (
        <div>
            <h1>User {id}</h1>
            <button onClick={() => navigate("/")}>Go Home</button>
        </div>
    );
}`,
            output: 'A multi-page app with Home, About, dynamic User, and 404 routes.',
            tasks: ['Set up React Router with 3 routes.', 'Create a dynamic route with useParams.', 'Use useNavigate to redirect after a form submit.'],
            challenge: 'Build a blog app with routes for home (/), post list (/posts), and individual post (/posts/:id).',
            devFession: 'I used <a href> instead of <Link> and the entire app reloaded on every navigation. Link prevents that.'
        }
    ]
};
