// Arrays & Array Methods
// Module 7 of 22

export const module207 = {
  id: 207,
  emoji: '📋',
  title: 'Arrays & Array Methods',
  tagline: 'Ordered data and powerful methods.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'j7-1',
      title: 'Array Basics',
      difficulty: 'beginner',
      duration: '10 min',
      prereqs: ['j6-3'],
      concepts: [
        'Arrays store ordered lists of values — any type, any length.',
        'Access by index: arr[0] is the first element (zero-indexed).',
        'push/pop add/remove from the end. shift/unshift from the beginning.',
        'slice returns a portion without modifying. splice modifies in place.',
        '.length tells you how many items.'
      ],
      code: `const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);     // "apple"
console.log(fruits.length); // 3

fruits.push("mango");       // add to end
fruits.pop();               // remove from end
fruits.unshift("kiwi");     // add to start
fruits.shift();             // remove from start

// slice (non-destructive)
const slice = fruits.slice(0, 2);

// splice (destructive)
fruits.splice(1, 1, "grape"); // replace index 1`,
      output: 'Array operations: access, add, remove, slice, and splice.',
      tasks: [
        'Create an array with 5 items.',
        'Use push, pop, shift, and unshift.',
        'Get a slice of 3 items without modifying the original.'
      ],
      challenge: 'Build a playlist array: add songs, remove the first one, replace the second.',
      devFession: 'I confused slice and splice for months. Slice is safe. Splice is surgery.'
    },
    {
      id: 'j7-2',
      title: 'map, filter, reduce & forEach',
      difficulty: 'beginner',
      duration: '14 min',
      prereqs: ['j7-1'],
      concepts: [
        'forEach loops through every item — use when you don\'t need a new array.',
        'map transforms every item and returns a NEW array.',
        'filter keeps only items that pass a test — returns a NEW array.',
        'reduce accumulates all items into a single value.',
        'These methods are the backbone of modern JavaScript.'
      ],
      code: `const nums = [1, 2, 3, 4, 5];

// forEach: just loops
nums.forEach(n => console.log(n));

// map: transform each item
const doubled = nums.map(n => n * 2);
// [2, 4, 6, 8, 10]

// filter: keep matching items
const evens = nums.filter(n => n % 2 === 0);
// [2, 4]

// reduce: combine into one value
const sum = nums.reduce((total, n) => total + n, 0);
// 15

// Chaining
const result = nums
    .filter(n => n > 2)
    .map(n => n * 10);
// [30, 40, 50]`,
      output: 'forEach loops, map transforms, filter selects, reduce accumulates.',
      tasks: [
        'Use map to double every number in an array.',
        'Use filter to get only strings longer than 3 characters.',
        'Use reduce to calculate the sum of an array.',
        'Chain filter and map together.'
      ],
      challenge: 'Given an array of products, filter by price > 20, then map to just the names.',
      devFession: 'I avoided reduce for months because it looked scary. It\'s just: start with a value, process each item, return the result.'
    }
  ]
};
