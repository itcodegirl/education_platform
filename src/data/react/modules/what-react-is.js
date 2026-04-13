// ═══════════════════════════════════════════════
// REACT MODULE 1: React Fundamentals
// 5 lessons from HTML course files:
//   1. What is React?
//   2. JSX Basics
//   3. Components Introduction
//   4. Props Basics
//   5. State Basics with useState
// ═══════════════════════════════════════════════

export const module1 = {
  id: 301,
  emoji: '⚛️',
  title: 'React Fundamentals',
  tagline: 'From zero to building interactive React apps.',
  difficulty: 'beginner',
  lessons: [
    {
      id: 'r1-1',
      title: 'What is React?',
      prereqs: [],
      difficulty: 'beginner',
      duration: '20 min',
      concepts: [
        'React is a JavaScript library by Facebook for building user interfaces. Instead of manually updating the page, React does it automatically.',
        'Virtual DOM: React keeps a virtual copy in memory, compares it to the real page, and only updates what changed. Like a smart diff tool.',
        'Declarative vs Imperative: Imperative = step-by-step directions. Declarative = just say the destination. React is declarative.',
        'Component-Based: React apps are built from small, reusable pieces called components. Like Lego bricks composing into complex structures.',
      ],
      code: `// Imperative (vanilla JS) — you manage every step\nconst btn = document.querySelector("#btn");\nbtn.addEventListener("click", () => {\n    const p = document.createElement("p");\n    p.textContent = "Clicked!";\n    document.body.appendChild(p);\n});\n\n// Declarative (React) — describe what you want\nfunction App() {\n    const [clicked, setClicked] = useState(false);\n    return (\n        <div>\n            <button onClick={() => setClicked(true)}>Click</button>\n            {clicked && <p>Clicked!</p>}\n        </div>\n    );\n}`,
      output: 'React lets you describe what your UI should look like, and it handles all the messy DOM updates for you.',
      tasks: [
        'Compare the vanilla JS counter vs React counter — notice how React updates are smoother',
        'Create my-first-react.html with CDN scripts and a HelloWorld component',
        'Change the component to show YOUR name and a personal message',
      ],
      challenge: 'Build a Welcome Card component: show your name in a heading, your favorite emoji, a fun fact, and a "Learn More" button.',
      devFession: 'I built a whole app with vanilla JS DOM manipulation. 400 lines of querySelector and appendChild. React does it in 40.',
    },
    {
      id: 'r1-2',
      title: 'JSX Basics',
      prereqs: ['r1-1'],
      difficulty: 'beginner',
      duration: '25 min',
      concepts: [
        'JSX is JavaScript, not HTML. It looks like HTML but gets transformed into React.createElement() calls by Babel.',
        'Use {} for JavaScript expressions: variables ({name}), math ({2+2}), ternary ({x > 10 ? "big" : "small"}), object properties ({user.name}).',
        'Use className instead of class (class is reserved in JS). Use camelCase for attributes: onClick, onChange, tabIndex.',
        'All tags must close in JSX: <img />, <input />, <br />. No exceptions.',
        'You cannot use if/else inside {}. Use ternary operators instead: {condition ? "yes" : "no"}.',
      ],
      code: `function Greeting() {\n    const name = "Sarah";\n    const age = 25;\n    const isStudent = true;\n    \n    return (\n        <div>\n            <h1>Hello, {name}!</h1>\n            <p>Age: {age}</p>\n            <p>Math works: {2 + 2}</p>\n            <p>Status: {isStudent ? "Student" : "Not a student"}</p>\n        </div>\n    );\n}`,
      output: 'Dynamic content rendered from JavaScript variables using curly braces!',
      tasks: [
        'Watch JSX transform to React.createElement — understand what Babel does',
        'Embed JavaScript expressions in JSX using {} — variables, math, ternaries',
        'Fix 5 common JSX mistakes: class→className, self-closing tags, camelCase, ternary instead of if/else',
        'Build a Profile Card with variables for name, title, skills array, and isAvailable boolean',
      ],
      challenge: 'Build a Product Card with dynamic pricing: show product name, original price, calculate 20% discount, show SALE badge if on sale (ternary), show stock count. All values from variables.',
      devFession: 'I spent 30 minutes trying to figure out why my React code was broken. The error? I wrote class instead of className. ONE WORD.',
    },
    {
      id: 'r1-3',
      title: 'Components Introduction',
      prereqs: ['r1-2'],
      difficulty: 'beginner',
      duration: '30 min',
      concepts: [
        'Components are just JavaScript functions that return JSX. Nothing magical about them.',
        'Component names MUST start with capital letters. React uses this to distinguish <Button /> (component) from <button> (HTML).',
        'Components can use other components — this is composition. Build complex UIs from simple parts, like Lego.',
        'Single Responsibility: each component should do ONE thing well. If it does too much, split it up.',
        'In real projects, each component lives in its own file with export/import.',
      ],
      code: `function Header() {\n    return <header><h1>My Blog</h1></header>;\n}\n\nfunction Article() {\n    return <article><h2>My Post</h2><p>Content here.</p></article>;\n}\n\nfunction Footer() {\n    return <footer><p>© 2024 My Blog</p></footer>;\n}\n\n// Compose them into a page!\nfunction BlogPage() {\n    return (\n        <div>\n            <Header />\n            <Article />\n            <Article />\n            <Footer />\n        </div>\n    );\n}`,
      output: 'A full page built from 4 small components! Article is reused twice.',
      tasks: [
        'Create a WelcomeMessage component and use it 3 times',
        'Compose Header, Article, and Footer into a BlogPage',
        'Split a big UserCard into Avatar, UserInfo, and FollowButton components',
        'Build a reusable Card component for a Dashboard',
      ],
      challenge: 'Build a Blog Post Preview using composition: AuthorInfo component (name + avatar), PostContent (title + excerpt), PostTags (2-3 tags), composed into BlogPostPreview. Render 2 previews.',
      devFession: 'My first React component was 300 lines long. My mentor said "If you can\'t explain what it does in one sentence, it\'s too big." Now I aim for 50 lines max.',
    },
    {
      id: 'r1-4',
      title: 'Props Basics',
      prereqs: ['r1-3'],
      difficulty: 'beginner',
      duration: '35 min',
      concepts: [
        'Props are like function arguments — they let you pass data INTO a component. Same component, different data = reusable!',
        'Props are READ-ONLY. Never modify props inside a component. React needs to control when data changes.',
        'Destructuring props: instead of props.name everywhere, use { name, age } in the function parameter. Cleaner code.',
        'Default props: give props fallback values with { name = "Guest" }. Component works even without all props provided.',
        'Props can be any type: strings, numbers, booleans, arrays, objects, even functions.',
      ],
      code: `function UserCard({ name, title, avatar, isOnline }) {\n    return (\n        <div style={{\n            border: '2px solid #e2e8f0',\n            borderRadius: '12px',\n            padding: '20px',\n            display: 'flex',\n            alignItems: 'center',\n            gap: '15px'\n        }}>\n            <div style={{ fontSize: '3em' }}>{avatar}</div>\n            <div>\n                <h3>{name}</h3>\n                <p>{title}</p>\n                <span style={{ color: isOnline ? '#48bb78' : '#999' }}>\n                    {isOnline ? '🟢 Online' : '⚫ Offline'}\n                </span>\n            </div>\n        </div>\n    );\n}\n\n// Same component, different data!\n<UserCard name="Sarah" title="Developer" avatar="👩‍💻" isOnline={true} />\n<UserCard name="Alex" title="Designer" avatar="🎨" isOnline={false} />`,
      output: 'Two completely different user cards from the same component — that is the power of props!',
      tasks: [
        'Pass your first prop — a name to a Greeting component',
        'Build a UserCard with name, title, avatar, and isOnline props',
        'Use destructuring and default values to clean up props',
        'Create a component that accepts different data types (string, number, boolean, array)',
      ],
      challenge: 'Build a Product Card System: ProductCard with name, price, image (emoji), inStock (boolean with default true). Create 3 different products. Show "In Stock" or "Out of Stock" based on the prop.',
      devFession: 'I once tried to change props inside a component: props.name = "new name". React yelled at me. Props are like a contract — the parent controls the data, the child just displays it.',
    },
    {
      id: 'r1-5',
      title: 'State Basics with useState',
      prereqs: ['r1-4'],
      difficulty: 'beginner',
      duration: '40 min',
      concepts: [
        'State is component memory — data that lives INSIDE the component and can change. Props come from outside; state is your own.',
        'useState returns [currentValue, setterFunction]. Always use the setter — never modify state directly.',
        'State changes trigger re-renders. When you call setCount(5), React re-runs your component with the new value and updates the DOM.',
        'Each component instance gets its own state. Two <Counter /> components have independent counts.',
        'Props vs State: Props are passed from parent (read-only). State is defined inside (can be updated). Props are function params; state is local variables.',
        'Never modify state directly: count++ won\'t work. Always use setCount(count + 1). Only the setter triggers re-renders.',
        'Functional updates: when new state depends on old state, use setCount(prev => prev + 1). Ensures correctness with rapid updates.',
      ],
      code: `function Counter() {\n    const [count, setCount] = useState(0);\n    \n    return (\n        <div>\n            <h2>Count: {count}</h2>\n            <button onClick={() => setCount(count + 1)}>Add 1</button>\n            <button onClick={() => setCount(count - 1)}>Subtract 1</button>\n            <button onClick={() => setCount(0)}>Reset</button>\n        </div>\n    );\n}\n\n// Like button with toggle\nfunction LikeButton() {\n    const [likes, setLikes] = useState(0);\n    const [isLiked, setIsLiked] = useState(false);\n    \n    const handleClick = () => {\n        if (isLiked) {\n            setLikes(likes - 1);\n            setIsLiked(false);\n        } else {\n            setLikes(likes + 1);\n            setIsLiked(true);\n        }\n    };\n    \n    return (\n        <button onClick={handleClick}>\n            {isLiked ? '❤️' : '🤍'} {likes} Likes\n        </button>\n    );\n}`,
      output: 'Interactive counter and like button — state makes components come alive!',
      tasks: [
        'Build a counter with +, -, and Reset buttons',
        'Create a form with multiple state variables (name, age, email)',
        'Build a Like button that toggles between liked/unliked with count',
        'Create a Toggle switch (ON/OFF) using boolean state',
        'Use functional updates: build a button that adds 3 in one click using prev => prev + 1',
      ],
      challenge: 'Build a Shopping Cart Counter: product with quantity controls (+/- buttons), calculated total price (quantity × price), "Add to Cart" button with alert, disable - button at 0.',
      devFession: 'I spent 2 hours debugging why my counter wasn\'t updating. I was writing count = count + 1 instead of setCount(count + 1). State setters are NOT optional.',
    },
  ],
};
