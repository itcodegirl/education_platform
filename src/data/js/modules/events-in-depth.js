// Events In Depth
// Module 10 of 22

export const module210 = {
  id: 210,
  emoji: '🎯',
  title: 'Events In Depth',
  tagline: 'Bubbling, delegation, and real-world patterns.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'j10-1',
      title: 'Event Bubbling & Delegation',
      difficulty: 'beginner',
      duration: '12 min',
      prereqs: ['j9-3'],
      concepts: [
        'Event bubbling: events travel UP from the target to the document.',
        'e.stopPropagation() stops the event from bubbling further.',
        'Event delegation: attach ONE listener to a parent instead of many to children.',
        'Delegation is more efficient and works for dynamically added elements.'
      ],
      code: `// Bubbling: click on child triggers parent too
document.querySelector(".parent").addEventListener("click", () => {
    console.log("Parent clicked");
});
document.querySelector(".child").addEventListener("click", (e) => {
    console.log("Child clicked");
    // e.stopPropagation(); // uncomment to stop bubbling
});

// Event delegation: one listener for many items
const list = document.querySelector(".todo-list");
list.addEventListener("click", (e) => {
    if (e.target.matches(".delete-btn")) {
        e.target.closest("li").remove();
    }
    if (e.target.matches(".todo-text")) {
        e.target.classList.toggle("done");
    }
});`,
      output: 'Bubbling logs both child and parent. Delegation handles clicks on any list item.',
      tasks: [
        'Create nested elements and observe event bubbling.',
        'Use stopPropagation to prevent bubbling.',
        'Implement event delegation on a list with delete buttons.'
      ],
      challenge: 'Build a todo list using event delegation — one listener handles toggle and delete for all items.',
      devFession: 'I attached 100 event listeners to 100 list items. Then someone showed me delegation. One listener. Same result.'
    }
  ]
};
