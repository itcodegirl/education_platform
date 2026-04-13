// ═══════════════════════════════════════════════
// REACT MODULE: Component Design Patterns
// 9 lessons: composition → children → lifting state →
// prop drilling → patterns → lifecycle → 2 projects → summary
// ═══════════════════════════════════════════════

export const module19 = {
  id: 319,
  emoji: '🏛️',
  title: 'Component Design Patterns',
  tagline: 'Build professional, reusable React applications.',
  difficulty: 'intermediate',
  lessons: [
    {
      id: 'r19-1', title: 'Component Composition', prereqs: ['r18-2'], difficulty: 'beginner', duration: '35 min',
      concepts: ['Composition over inheritance: React builds complex UIs by combining simple components, not extending base classes.', 'Component hierarchy: components can contain other components, creating a tree structure.', 'Single Responsibility: each component does ONE thing well — Card handles the container, CardHeader handles the header.', 'Reusability through composition: the same Card components work for user profiles, products, blog posts — anything.'],
      code: `function Card({ children }) {\n  return <div className="card">{children}</div>;\n}\nfunction CardHeader({ title }) {\n  return <div className="card-header"><h3>{title}</h3></div>;\n}\nfunction CardBody({ children }) {\n  return <div className="card-body">{children}</div>;\n}\n\n// Compose small pieces into anything:\n<Card>\n  <CardHeader title="User Profile" />\n  <CardBody>\n    <p>Name: Jenna</p>\n    <p>Role: Developer</p>\n  </CardBody>\n</Card>`,
      output: 'A reusable Card system! The same components work for user profiles, products, blog posts — anything.',
      tasks: ['Build Card, CardHeader, CardBody, CardFooter components', 'Create a Page layout with Sidebar + Main using composition', 'Compose a Modal with Header, Content, and Actions slots', 'Build Nav > NavList > NavItem hierarchy', 'Create an Alert system with Icon, Title, Message, Actions'],
      challenge: 'Build a Dashboard Layout System: wrapper, header with nav, sidebar with sections, main content area, widget components. Show 3 different pages using the same components.',
      devFession: 'I once built a 600-line "SuperComponent" that tried to do everything. My tech lead made me split it into 12 small components. It took 2 hours but the code was 10x more readable.',
    },
    {
      id: 'r19-2', title: 'The Children Prop', prereqs: ['r19-1'], difficulty: 'beginner', duration: '30 min',
      concepts: ['props.children: a special prop containing everything between a component\'s opening and closing tags.', 'Wrapper components: their main job is to wrap other content with styling or behavior. Children keeps them flexible.', 'Children can be anything: strings, JSX, other components, arrays. This is what makes React composable.', 'When to use children vs explicit props: use children when the content is unknown or varied, use explicit props when you know the exact shape.'],
      code: `function Button({ children, variant = "primary" }) {\n  return <button className={\`btn btn-\${variant}\`}>{children}</button>;\n}\n\n// Put ANYTHING inside:\n<Button>Click me</Button>\n<Button variant="danger">🗑️ Delete</Button>\n<Button><span>⬇️</span> Download</Button>`,
      output: 'The children prop contains everything between the tags. It can be text, elements, components — anything!',
      tasks: ['Create a Button wrapper that accepts any content', 'Build a Panel component with border that wraps children', 'Create a Centered wrapper component', 'Build a Tabs system where each tab content is children', 'Create an ErrorBoundary wrapper'],
      challenge: 'Build a Feature Flag System: Feature component shows/hides children based on featureName prop. Config object enables/disables features. Fallback prop for disabled state.',
      devFession: 'I used to pass every piece of content as a separate prop: title, subtitle, body, footer, icon, badge... Then someone showed me children and I deleted 15 props from one component.',
    },
    {
      id: 'r19-3', title: 'Lifting State Up', prereqs: ['r19-2'], difficulty: 'intermediate', duration: '40 min',
      concepts: ['Lifting state: moving state from a child to the nearest common parent so multiple children can share it.', 'Single source of truth: state lives in ONE place. Multiple components read from it, preventing sync issues.', 'Data down, events up: parent passes data via props, children send events via callbacks. One-way data flow.', 'When NOT to lift state: if only one component uses it, keep it local. Don\'t over-lift.'],
      code: `function Display({ count }) {\n  return <h1>Count: {count}</h1>;\n}\nfunction Controls({ onIncrement, onDecrement }) {\n  return (\n    <div>\n      <button onClick={onDecrement}>-</button>\n      <button onClick={onIncrement}>+</button>\n    </div>\n  );\n}\nfunction App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <Display count={count} />\n      <Controls\n        onIncrement={() => setCount(c => c + 1)}\n        onDecrement={() => setCount(c => c - 1)}\n      />\n    </div>\n  );\n}`,
      output: 'Display and Controls are siblings — they share state through their common parent App!',
      tasks: ['Share counter between sibling components', 'Build temperature converter (Celsius ↔ Fahrenheit stay in sync)', 'Create filtered list with SearchBar + List sharing filter state', 'Build shopping cart with ProductList + Cart sharing items', 'Multi-step form where steps share form data from parent'],
      challenge: 'Build a Color Palette Generator: ColorPicker (RGB sliders), ColorDisplay (shows color), PaletteList (saved colors). All share state from App. Save, load, delete colors.',
      devFession: 'I once had two components showing different values for the same data because each had its own local state. Took me 3 hours to realize they needed to share state from a parent. Three. Hours.',
    },
    {
      id: 'r19-4', title: 'Prop Drilling Problem', prereqs: ['r19-3'], difficulty: 'intermediate', duration: '35 min',
      concepts: ['Prop drilling: passing props through many intermediate components that don\'t use them.', 'Why it\'s a problem: middle components become unnecessarily coupled to data they don\'t care about.', 'Composition as a solution: instead of passing through middle components, compose the tree so data goes directly to the consumer.', 'When drilling is fine: for 2-3 levels, it\'s simpler than alternatives. Don\'t over-engineer.'],
      code: `// 🚫 Prop drilling:\nfunction App() {\n  const [user] = useState({ name: 'Jenna' });\n  return <Layout user={user} />;  // passes through\n}\nfunction Layout({ user }) {\n  return <Header user={user} />;  // just passing!\n}\nfunction Header({ user }) {\n  return <UserMenu user={user} />; // finally used\n}\n\n// ✅ Fixed with composition:\nfunction App() {\n  const [user] = useState({ name: 'Jenna' });\n  return (\n    <Layout>\n      <Header>\n        <UserMenu user={user} />\n      </Header>\n    </Layout>\n  );\n}`,
      output: 'With composition, Layout and Header don\'t need to know about user at all. Only UserMenu receives it directly.',
      tasks: ['Identify prop drilling in a component tree', 'Solve drilling with composition', 'Use children to skip intermediate components', 'Build a theme system that drills 5 levels, then refactor'],
      challenge: 'Refactor an app that drills user data 6 levels deep. Eliminate unnecessary drilling using composition. Keep the same functionality. Don\'t use Context (that\'s a later module).',
      devFession: 'I once drilled a "theme" prop through 11 components. ELEVEN. When I learned about composition, I removed it from 9 of them in 20 minutes.',
    },
    {
      id: 'r19-5', title: 'Component Patterns', prereqs: ['r19-4'], difficulty: 'intermediate', duration: '45 min',
      concepts: ['Container/Presentational: split into logic (container) and UI (presentational). Containers handle data; presentational components just render.', 'Compound Components: multiple components working together as a unit, sharing implicit state. Like select/option in HTML.', 'Controlled vs Uncontrolled: controlled = parent manages state. Uncontrolled = component manages its own. Trade-off between control and simplicity.', 'When to use each: Container/Presentational for data-heavy components. Compound for related groups. Controlled for forms.'],
      code: `// Container: handles logic\nfunction UserListContainer() {\n  const [users, setUsers] = useState([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch('/api/users')\n      .then(r => r.json())\n      .then(data => { setUsers(data); setLoading(false); });\n  }, []);\n\n  if (loading) return <p>Loading...</p>;\n  return <UserListView users={users} />;\n}\n\n// Presentational: pure UI\nfunction UserListView({ users }) {\n  return (\n    <ul>\n      {users.map(u => <li key={u.id}>{u.name}</li>)}\n    </ul>\n  );\n}`,
      output: 'Container handles WHERE data comes from. Presentational handles HOW it looks. They\'re independent and reusable!',
      tasks: ['Build Container/Presentational pair for UserList', 'Create Compound Accordion (Accordion.Item, .Header, .Body)', 'Refactor a mixed component into Container/Presentational', 'Build Tabs compound component (Tabs, TabList, Tab, TabPanels)', 'Create a controlled Select component'],
      challenge: 'Build a Data Table System: TableContainer (data, sorting, pagination), TableView (pure UI), compound components (Table.Header, Table.Row, Table.Cell). Sortable, paginated, works with any data.',
      devFession: 'I tried to make a component that was both "smart" and "pretty." It was 400 lines of spaghetti. Splitting into Container + Presentational: each under 100 lines.',
    },
    {
      id: 'r19-6', title: 'Component Lifecycle with useEffect', prereqs: ['r19-5'], difficulty: 'intermediate', duration: '50 min',
      concepts: ['Mount: when component first appears. useEffect with [] runs once here.', 'Update: when state/props change. useEffect with [dep1, dep2] runs when those change.', 'Unmount: when component is removed. Cleanup function runs here — clear timers, cancel requests.', 'Dependency array: [] = mount only. [x] = when x changes. No array = every render.', 'Multiple effects: separate concerns into different useEffect calls.'],
      code: `function Clock() {\n  const [time, setTime] = useState(new Date());\n\n  useEffect(() => {\n    const timer = setInterval(() => setTime(new Date()), 1000);\n    return () => clearInterval(timer); // Cleanup!\n  }, []); // Mount only\n\n  return <p>{time.toLocaleTimeString()}</p>;\n}`,
      output: 'Clock starts on mount, stops on unmount. Without cleanup, the timer would leak!',
      tasks: ['Run effect on mount (fetch data)', 'Use dependency array (effect on specific value change)', 'Implement cleanup (clear timer on unmount)', 'Multiple effects for separation of concerns', 'Build a live clock with proper cleanup'],
      challenge: 'Build a Live Dashboard: fetch on mount, poll every 5 seconds, update document title, listen to resize, clean up ALL effects. Show loading/error states.',
      devFession: 'I caused an infinite loop by putting an object in the dependency array. Every render = new object reference = triggered effect = re-render. Browser froze.',
    },
    {
      id: 'r19-7', title: 'Project 1: Real-Time Chat Interface', prereqs: ['r19-6'], difficulty: 'intermediate', duration: '150 min',
      concepts: ['Guided project using ALL Module 2 patterns: composition, children, lifting state, Container/Presentational, lifecycle.', 'Build: ChatApp (container), ChatWindow, MessageList, Message, MessageInput, UserList, TypingIndicator, Avatar.', 'ChatApp is the container. All others are presentational.'],
      code: `// Architecture:\n// ChatApp (container)\n//   ├── UserList\n//   └── ChatWindow (children)\n//       ├── MessageList > Message\n//       ├── TypingIndicator\n//       └── MessageInput`,
      output: 'A fully functional chat interface built with professional component patterns.',
      tasks: ['Build all 9 components following the architecture above'],
      challenge: 'Add emoji picker, message reactions, user online/offline status.',
      devFession: 'My first chat app was one giant 500-line component. Splitting into 9 components felt like overkill — but each was so simple to debug.',
    },
    {
      id: 'r19-8', title: 'Project 2: Blog Platform', prereqs: ['r19-7'], difficulty: 'intermediate', duration: '180 min',
      concepts: ['Independent project — no starter code. Design the architecture yourself.', 'Build: PostList, PostCard, PostDetail, CommentSection, Comment (compound), AuthorCard, CategoryFilter, SearchBar.', 'Must use all patterns: Container/Presentational, state lifting, composition, children, lifecycle.'],
      code: `// Your architecture:\n// BlogApp (container)\n//   ├── SearchBar + CategoryFilter\n//   ├── PostList > PostCard\n//   ├── PostDetail\n//   │   ├── AuthorCard\n//   │   └── CommentSection > Comment\n//   └── RelatedPosts`,
      output: 'A complete blog platform with posts, comments, filtering, search, sorting.',
      tasks: ['Plan component tree, then build all components using professional patterns'],
      challenge: 'Add markdown support, reading time estimates, bookmarks.',
      devFession: 'I submitted a blog project for a job interview. The interviewer said "I can tell you understand component architecture." It wasn\'t complex — it was clean.',
    },
    {
      id: 'r19-9', title: 'Module 2 Completion & Next Steps', prereqs: ['r19-8'], difficulty: 'beginner', duration: '25 min',
      concepts: ['Skills mastered: composition, children, state lifting, prop drilling solutions, Container/Presentational, Compound Components, useEffect lifecycle.', 'Before: "I can make a button change text." After: "I can architect a professional application."', 'These patterns are used at every React company. You can now work on production codebases.'],
      code: `// Your progression:\n// Module 1: "I can make a button change text"\n// Module 2: "I can architect a professional application"\n//\n// Patterns mastered:\n// ✓ Composition\n// ✓ Container/Presentational\n// ✓ Compound Components\n// ✓ Children prop\n// ✓ State lifting\n// ✓ Prop drilling solutions\n// ✓ useEffect lifecycle`,
      output: 'You can now work on production codebases. Next: Module 3 — Side Effects & Data Fetching.',
      devFession: 'The day I understood component patterns was the day I stopped feeling like a "beginner" and started feeling like a developer.',
    },
  ],
};
