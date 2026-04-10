export const module21 = {
    id: 321,
    emoji: '🔐',
    title: 'Backend Integration & Auth',
    tagline: 'Connect to real services.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r21-1',
            prereqs: ['r20-1'],
            title: 'Supabase & Authentication',
            difficulty: 'intermediate',
            duration: '14 min',
            concepts: [
                'Supabase provides a Postgres database, authentication, and real-time features.',
                'supabase.auth.signUp/signInWithPassword handle email auth.',
                'supabase.auth.signInWithOAuth handles Google/GitHub login.',
                'Row Level Security (RLS) ensures users only access their own data.',
                'Store the Supabase URL and anon key in environment variables.'
            ],
            code: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Sign up
async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email, password
    });
}

// Sign in
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email, password
    });
}

// Read data with RLS
async function getTodos() {
    const { data } = await supabase
        .from("todos")
        .select("*");
    return data;
}`,
            output: 'Supabase auth and database queries in a React app.',
            tasks: ['Set up a Supabase project and get your keys.', 'Create a sign-up form that calls supabase.auth.signUp.', 'Query data from a Supabase table.'],
            challenge: 'Build a full auth flow: sign up, log in, protected routes, and log out.',
            devFession: 'I stored API keys in my JavaScript file and pushed to GitHub. Environment variables exist to prevent exactly this.'
        }
    ]
};
