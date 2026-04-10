export const module2 = {
    id: 302,
    emoji: '📝',
    title: 'JSX — The Language of React',
    tagline: 'HTML meets JavaScript.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r2-1',
            prereqs: ['r1-2'],
            title: 'JSX Rules & Expressions',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: [
                'JSX looks like HTML but compiles to JavaScript function calls.',
                'Rule 1: Every component must return ONE parent element (use <div> or <>).',
                'Rule 2: Use className instead of class, htmlFor instead of for.',
                'Rule 3: All tags must be closed — including self-closing (<img />, <br />).',
                'Embed JavaScript in JSX with curly braces: {expression}.'
            ],
            code: `function Profile() {
    const name = "Jenna";
    const skills = ["HTML", "CSS", "JS"];
    const isOnline = true;

    return (
        <div className="profile">
            <h1>Hello, {name}!</h1>
            <p>Skills: {skills.length}</p>
            <p>Status: {isOnline ? "Online" : "Offline"}</p>
            <img src="avatar.jpg" alt="Profile" />
        </div>
    );
}`,
            output: 'A profile component with dynamic name, skill count, and status.',
            tasks: ['Create a component that uses className and embeds a variable.', 'Use a ternary expression inside JSX.', 'Return multiple elements wrapped in a fragment (<>...</>).'],
            challenge: 'Build a user card component that displays name, email, and "Active"/"Inactive" status dynamically.',
            devFession: 'I wrote class= instead of className= and spent 20 minutes debugging. React warns you, but only in the console.'
        }
    ]
};
