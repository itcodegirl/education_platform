export const module22 = {
    id: 322,
    emoji: '♿',
    title: 'Accessibility in React',
    tagline: 'Build for everyone.',
    difficulty: 'advanced',
    lessons: [
        {
            id: 'r22-1',
            prereqs: ['r21-1'],
            title: 'A11y Best Practices in React',
            difficulty: 'beginner',
            duration: '10 min',
            concepts: [
                'Use semantic HTML inside components — <button>, <nav>, <main>, not <div onClick>.',
                'Every interactive element needs keyboard support — onKeyDown alongside onClick.',
                'Use aria-label for icon buttons, aria-live for dynamic content.',
                'jsx-a11y ESLint plugin catches accessibility issues during development.',
                'Test with keyboard navigation and screen readers.'
            ],
            code: `// BAD: div as button
<div onClick={handleClick}>Click me</div>

// GOOD: actual button
<button onClick={handleClick}>Click me</button>

// Icon button needs aria-label
<button onClick={onClose} aria-label="Close menu">
    <CloseIcon />
</button>

// Dynamic content needs aria-live
<div aria-live="polite">
    {message && <p>{message}</p>}
</div>

// Skip link for keyboard users
<a href="#main" className="skip-link">
    Skip to main content
</a>`,
            output: 'Accessible buttons, ARIA labels, and live regions.',
            tasks: ['Replace a <div onClick> with a <button>.', 'Add aria-label to every icon button.', 'Navigate your app with Tab key only — fix any issues.'],
            challenge: 'Run an accessibility audit on your app and fix every issue found.',
            devFession: 'I used <div onClick> for buttons. Screen readers had no idea they were clickable. Use <button>. Always.'
        }
    ]
};
