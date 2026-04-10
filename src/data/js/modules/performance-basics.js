// Performance Basics
// Module 20 of 22

export const module220 = {
  id: 220,
  emoji: '🚀',
  title: 'Performance Basics',
  tagline: 'Make it fast.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j20-1',
      title: 'Debounce & Throttle',
      difficulty: 'intermediate',
      duration: '10 min',
      prereqs: ['j19-1'],
      concepts: [
        'Debounce: waits until the user STOPS doing something, then fires once.',
        'Throttle: fires at most once per interval, no matter how often triggered.',
        'Search inputs should be debounced — don\'t fetch on every keystroke.',
        'Scroll handlers should be throttled — don\'t run 60 times per second.'
      ],
      code: `// Debounce: wait until typing stops
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const search = debounce((query) => {
    console.log("Searching:", query);
}, 300);

// input.addEventListener("input", (e) => {
//     search(e.target.value);
// });

// Throttle: run at most once per interval
function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}`,
      output: 'Debounce waits for pause. Throttle limits frequency.',
      tasks: [
        'Implement a debounced search input.',
        'Implement a throttled scroll handler.',
        'Compare behavior: type fast with and without debounce.'
      ],
      challenge: 'Add debounced search to an input that filters a list of items.',
      devFession: 'My search input fired a fetch request on every single keystroke. 47 API calls to type "JavaScript." Debounce fixed it.'
    }
  ]
};
