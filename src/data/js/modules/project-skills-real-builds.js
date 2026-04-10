// Project Skills & Real Builds
// Module 21 of 22

export const module221 = {
  id: 221,
  emoji: '🔨',
  title: 'Project Skills & Real Builds',
  tagline: 'Build real things that work.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j21-1',
      title: 'Interactive UI & Dark Mode',
      difficulty: 'beginner',
      duration: '12 min',
      prereqs: ['j20-1'],
      concepts: [
        'Toggle dark mode by switching a class on the body.',
        'Save the preference in localStorage so it persists.',
        'Use classList.toggle for clean state switching.',
        'Event delegation handles dynamic UI elements.'
      ],
      code: `// Dark mode toggle
const toggleBtn = document.querySelector("#theme-btn");
const saved = localStorage.getItem("theme");
if (saved === "dark") document.body.classList.add("dark");

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});`,
      output: 'A working dark mode toggle that remembers the user\'s choice.',
      tasks: [
        'Build a dark mode toggle button.',
        'Save theme preference to localStorage.',
        'Load the saved preference on page load.'
      ],
      challenge: 'Build a complete dark mode system with toggle button, localStorage, and system preference detection.',
      devFession: 'My dark mode worked until I refreshed the page. localStorage is the difference between a demo and a feature.'
    },
    {
      id: 'j21-2',
      title: 'Form Handling & Validation',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j21-1'],
      concepts: [
        'preventDefault() stops the form from reloading the page.',
        'Access input values with input.value inside the submit handler.',
        'Validate before submitting — check empty fields, email format, length.',
        'Show error messages next to the relevant input.'
      ],
      code: `const form = document.querySelector("#signup");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#name").value.trim();
    const email = form.querySelector("#email").value.trim();

    // Validate
    if (!name) {
        showError("name", "Name is required");
        return;
    }
    if (!email.includes("@")) {
        showError("email", "Invalid email");
        return;
    }

    console.log("Submitted:", { name, email });
});

function showError(fieldId, message) {
    const field = document.querySelector(\`#\${fieldId}\`);
    field.nextElementSibling.textContent = message;
}`,
      output: 'A form that validates inputs and shows error messages.',
      tasks: [
        'Build a form with JavaScript validation.',
        'Show inline error messages for invalid fields.',
        'Clear errors when the user corrects their input.'
      ],
      challenge: 'Build a registration form with name, email, password, and confirm password validation.',
      devFession: 'I validated the form on the server but not the client. Users saw nothing until they got a blank error page.'
    },
    {
      id: 'j21-3',
      title: 'Fetch, Render & Dynamic UI',
      difficulty: 'beginner',
      duration: '14 min',
      prereqs: ['j21-2'],
      concepts: [
        'Fetch data from an API, then render it into the DOM.',
        'Use map to transform data into HTML strings or elements.',
        'innerHTML is fast for rendering but dangerous with user input.',
        'createElement + appendChild is safer for dynamic content.'
      ],
      code: `async function loadUsers() {
    const res = await fetch(
        "https://jsonplaceholder.typicode.com/users"
    );
    const users = await res.json();

    const container = document.querySelector("#users");
    container.innerHTML = users.map(user => \`
        <div class="card">
            <h3>\${user.name}</h3>
            <p>\${user.email}</p>
            <p>\${user.company.name}</p>
        </div>
    \`).join("");
}

loadUsers();`,
      output: 'User cards dynamically rendered from API data.',
      tasks: [
        'Fetch data from a public API.',
        'Render the data as cards in the DOM.',
        'Add a loading state while data is being fetched.'
      ],
      challenge: 'Build a user directory: fetch users, display as cards, add a search filter.',
      devFession: 'I rendered an empty page for 2 seconds before data loaded. A loading spinner would have been nice.'
    }
  ]
};
