export const module5 = {
    id: 305,
    emoji: '🖱️',
    title: 'Events in React',
    tagline: 'Make things respond.',
    difficulty: 'beginner',
    lessons: [
        {
            id: 'r5-1',
            prereqs: ['r4-1'],
            title: 'Handling Events',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: ['React events use camelCase: onClick, onChange, onSubmit.', 'Pass a function reference, not a function call: onClick={handleClick} not onClick={handleClick()}.', 'The event object (e) works like vanilla JS — e.target, e.preventDefault().', 'Common events: onClick (buttons), onChange (inputs), onSubmit (forms).'],
            code: `function App() {
    function handleClick() {
        alert("Button clicked!");
    }

    function handleInput(e) {
        console.log("Typed:", e.target.value);
    }

    function handleSubmit(e) {
        e.preventDefault();
        console.log("Form submitted!");
    }

    return (
        <div>
            <button onClick={handleClick}>Click Me</button>
            <input onChange={handleInput} placeholder="Type..." />
            <form onSubmit={handleSubmit}>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
}`,
            output: 'A button click, input change, and form submit — all handled in React.',
            tasks: ['Add onClick to a button that logs a message.', 'Add onChange to an input that logs the value.', 'Add onSubmit to a form with preventDefault.'],
            challenge: 'Build a counter with increment, decrement, and reset buttons.',
            devFession: 'I wrote onClick={handleClick()} with parentheses. It fired immediately on render, not on click. No parentheses!'
        }
    ]
};
