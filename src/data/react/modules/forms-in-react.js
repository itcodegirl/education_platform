export const module8 = {
    id: 308,
    emoji: '📝',
    title: 'Forms in React',
    tagline: 'Controlled inputs, clean data.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r8-1',
            prereqs: ['r7-2'],
            title: 'Controlled Components & Form Handling',
            difficulty: 'beginner',
            duration: '12 min',
            concepts: ['Controlled components: React state is the single source of truth for input values.', 'value={state} + onChange={setSetter} = controlled input.', 'onSubmit on the form + e.preventDefault() handles submission.', 'Manage multiple inputs with one state object.'],
            code: `function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitted:", form);
        setForm({ name: "", email: "", message: "" });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="name" value={form.name}
                   onChange={handleChange} placeholder="Name" />
            <input name="email" value={form.email}
                   onChange={handleChange} placeholder="Email" />
            <textarea name="message" value={form.message}
                      onChange={handleChange} placeholder="Message" />
            <button type="submit">Send</button>
        </form>
    );
}`,
            output: 'A controlled form with name, email, message, and submit handling.',
            tasks: ['Build a controlled input with value and onChange.', 'Handle multiple inputs with one state object.', 'Clear the form after submission.'],
            challenge: 'Build a registration form with validation — show errors for empty or invalid fields.',
            devFession: 'I forgot to add value= to my input and it became uncontrolled. React was tracking nothing.'
        }
    ]
};
