// Think Like a Developer
// Module 22 of 22

export const module222 = {
  id: 222,
  emoji: '🧠',
  title: 'Think Like a Developer',
  tagline: 'Errors are clues, not failures.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j22-1',
      title: 'Problem-Solving & Debugging Mindset',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j21-3'],
      concepts: [
        'Break every problem into smaller steps before writing code.',
        'Write pseudocode first — English instructions, then translate to JavaScript.',
        'Errors are clues, not failures — read the message, find the line, understand the cause.',
        'Rubber duck debugging: explain your code out loud to find the bug.',
        'If you can build a multi-page app with forms, fetch data, and handle errors — you\'re job-ready.'
      ],
      code: `// Pseudocode first:
// 1. Get the input value
// 2. Validate it
// 3. If valid, add to the list
// 4. Clear the input
// 5. Save to localStorage

// Then translate:
function addTodo() {
    const input = document.querySelector("#todo-input");
    const value = input.value.trim();

    if (!value) return; // validation

    const li = document.createElement("li");
    li.textContent = value;
    document.querySelector("#todo-list").appendChild(li);

    input.value = ""; // clear
    saveTodos();       // persist
}`,
      output: 'Pseudocode translated into working JavaScript.',
      tasks: [
        'Write pseudocode for a countdown timer before coding it.',
        'Read an error message and identify the exact line and cause.',
        'Explain a piece of your code out loud (rubber duck debugging).'
      ],
      challenge: 'Pick any project idea, write the pseudocode FIRST, then build it step by step.',
      devFession: 'I used to stare at a blank editor for 20 minutes. Now I write pseudocode first and the code practically writes itself.'
    }
  ]
};
