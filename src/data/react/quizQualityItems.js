export const REACT_QUIZ_QUALITY_ITEMS = Object.freeze({
  'r2-4:r2d1': {
    id: 'r2d8',
    type: 'bug',
    question: 'Scenario: a controlled email field cannot be typed into. Which line is the form-state mistake?',
    lines: ['const [email, setEmail] = useState("");', 'return <input value={email} />;', '// user cannot type into the field'],
    correct: 1,
    explanation: 'A controlled input needs onChange to update the state behind value. Add onChange={(event) => setEmail(event.target.value)}.',
  },
  'r2-6:r2f1': {
    id: 'r2f8',
    type: 'bug',
    question: 'Scenario: a task manager does not re-render after adding a task. Which line is the array-state mistake?',
    lines: ['tasks.push(newTask);', 'setTasks(tasks);', 'renderTasks(tasks);'],
    correct: 0,
    explanation: 'push mutates the existing array. React needs a new reference, such as setTasks((prev) => [...prev, newTask]).',
  },
  'r4-1:r4a1': {
    id: 'r4a8',
    type: 'bug',
    question: 'Scenario: a profile card changes the parent data by accident. Which line is the props mistake?',
    lines: ['function ProfileCard({ user }) {', '  user.name = "Guest";', '  return <h2>{user.name}</h2>;', '}'],
    correct: 1,
    explanation: 'Props are read-only inputs. Ask the parent to update state instead of mutating user inside the child.',
  },
  'r5-1:r5a1': {
    id: 'r5a8',
    type: 'bug',
    question: 'Scenario: a save action runs before the user clicks the button. Which line is the event-handler mistake?',
    lines: ['<button onClick={saveProfile()}>Save</button>', 'function saveProfile() {', '  setSaved(true);', '}'],
    correct: 0,
    explanation: 'saveProfile() calls the function during render. Pass a reference with onClick={saveProfile} or wrap it in an arrow.',
  },
  'r6-1:r6a1': {
    id: 'r6a8',
    type: 'bug',
    question: 'Scenario: a counter should add two, but only adds one. Which line is the stale-state mistake?',
    lines: ['setCount(count + 1);', 'setCount((prev) => prev + 1);', '// expected two safe increments'],
    correct: 0,
    explanation: 'When the next value depends on the previous value, use a functional update both times so each increment reads the latest state.',
  },
  'r6-2:r6b1': {
    id: 'r6b8',
    type: 'bug',
    question: 'Scenario: a settings panel changes but React does not update reliably. Which line is the object-state mistake?',
    lines: ['const next = settings;', 'next.theme = "dark";', 'setSettings(next);'],
    correct: 0,
    explanation: 'next points to the same object as settings. Create a new object with setSettings((prev) => ({ ...prev, theme: "dark" })).',
  },
  'r6-3:r6c1': {
    id: 'r6c8',
    type: 'bug',
    question: 'Scenario: a cart badge gets out of sync with the item list. Which line is the derived-state mistake?',
    lines: ['const [total, setTotal] = useState(items.length);', 'items.push(newItem);', '// total is never recalculated from items'],
    correct: 0,
    explanation: 'A total derived from items is safer when calculated during render. Storing it separately creates sync bugs.',
  },
  'r7-1:r7a1': {
    id: 'r7a8',
    type: 'bug',
    question: 'Scenario: an unread badge shows a stray 0. Which line is the conditional-rendering mistake?',
    lines: ['return <>{count && <p>{count} unread</p>}</>;', '// count can be 0'],
    correct: 0,
    explanation: 'React renders the number 0. Use count > 0 && ... when zero should render nothing.',
  },
  'r7-2:r7b1': {
    id: 'r7b8',
    type: 'bug',
    question: 'Scenario: editing a reordered list updates the wrong row. Which line is the key mistake?',
    lines: ['{items.map((item, index) => (', '  <Todo key={index} todo={item} />', '))}'],
    correct: 1,
    explanation: 'Array indexes are unstable when items reorder. Use a persistent item.id key so React preserves each row correctly.',
  },
  'r8-1:r8a1': {
    id: 'r8a8',
    type: 'bug',
    question: 'Scenario: typing in one field erases the rest of the form. Which line is the multi-field form mistake?',
    lines: ['setForm({ [event.target.name]: event.target.value });', '// typing email removes name and message'],
    correct: 0,
    explanation: 'The update replaces the whole form object. Spread the previous state before changing one field.',
  },
  'r8-2:r8b1': {
    id: 'r8b8',
    type: 'bug',
    question: 'Scenario: a React Hook Form error message crashes before validation runs. Which line is the error-access mistake?',
    lines: ['<input {...register("email")} />', '{errors.email.message && <p>{errors.email.message}</p>}'],
    correct: 1,
    explanation: 'errors.email can be undefined. Use optional chaining, such as errors.email?.message, before rendering the message.',
  },
  'r9-1:r9a1': {
    id: 'r9a8',
    type: 'bug',
    question: 'Scenario: a profile page keeps showing the old user after navigation. Which line is the effect-dependency mistake?',
    lines: ['useEffect(() => {', '  fetchUser(userId);', '}, []);'],
    correct: 2,
    explanation: 'The effect reads userId, so userId belongs in the dependency array. Otherwise the fetch only uses the first value.',
  },
  'r12-1:r12a1': {
    id: 'r12a8',
    type: 'bug',
    question: 'Scenario: a warning banner style is ignored in React. Which line is the style-prop mistake?',
    lines: ['return <div style="color: red">Warning</div>;', '// React expects the style prop to receive an object'],
    correct: 0,
    explanation: 'React style expects an object, such as style={{ color: "red" }}, not an HTML-style string.',
  },
  'r13-2:r13b1': {
    id: 'r13b8',
    type: 'bug',
    question: 'Scenario: a protected page briefly shows private content before redirecting. Which line is the route-guard mistake?',
    lines: ['if (!user) navigate("/login");', 'return <Dashboard />;'],
    correct: 0,
    explanation: 'Navigation as a render side effect can flash protected UI. Return a guarded route or <Navigate /> before rendering the dashboard.',
  },
  'r16-3:r16c1': {
    id: 'r16c8',
    type: 'bug',
    question: 'Scenario: a table with 20,000 rows still freezes after adding virtualization. Which line is the performance mistake?',
    lines: ['const visibleRows = rows.map((row) => <Row key={row.id} row={row} />);', 'return <ul>{visibleRows}</ul>;'],
    correct: 0,
    explanation: 'Mapping every row still renders the full list. Virtualization should render only the visible window plus overscan.',
  },
  'r19-2:r19b1': {
    id: 'r19b8',
    type: 'bug',
    question: 'Scenario: a reusable Card never displays the nested content. Which line is the children-prop mistake?',
    lines: ['function Card({ content }) {', '  return <section>{children}</section>;', '}'],
    correct: 1,
    explanation: 'The component uses children but did not receive it from props. Destructure { children } or render the content prop consistently.',
  },
  'r19-4:r19d1': {
    id: 'r19d8',
    type: 'bug',
    question: 'Scenario: a layout component only forwards user data through the tree. Which line is the prop-drilling mistake?',
    lines: ['function Layout({ user }) {', '  return <Header user={user} />;', '}', '// Layout never reads user itself'],
    correct: 1,
    explanation: 'Passing props through components that do not use them is prop drilling. Composition or context can keep the data closer to where it is needed.',
  },
  'r19-6:r19f1': {
    id: 'r19f8',
    type: 'bug',
    question: 'Scenario: resizing the window gets slower after visiting a page several times. Which line is the cleanup mistake?',
    lines: ['useEffect(() => {', '  window.addEventListener("resize", onResize);', '}, []);'],
    correct: 1,
    explanation: 'The listener is added without cleanup. Return a function that removes the resize listener when the component unmounts.',
  },
  'r19-7:r19g1': {
    id: 'r19g8',
    type: 'bug',
    question: 'Scenario: a chat message appears in data but React does not always repaint. Which line is the message-state mistake?',
    lines: ['messages.push(newMessage);', 'setMessages(messages);', 'scrollToBottom();'],
    correct: 0,
    explanation: 'push mutates the existing messages array. Use setMessages((prev) => [...prev, newMessage]) so React receives a new reference.',
  },
  'r19-8:r19h1': {
    id: 'r19h8',
    type: 'bug',
    question: 'Scenario: sorting blog posts also changes the original feed order. Which line is the mutation mistake?',
    lines: ['const filtered = posts.sort((a, b) => b.date - a.date);', 'setPosts(filtered);'],
    correct: 0,
    explanation: 'sort mutates the original array. Copy first with [...posts].sort(...) before saving or deriving sorted output.',
  },
  'r19-9:r19i1': {
    id: 'r19i11',
    type: 'bug',
    question: 'Scenario: a final React project review misses important UI states. Which line is the readiness mistake?',
    lines: ['explain state ownership for each component', 'test the main user flow', 'skip reviewing loading and error UI'],
    correct: 2,
    explanation: 'Loading and error UI are part of production readiness. A complete review checks happy, empty, loading, and failure states.',
  },
  'r20-1:r20a1': {
    id: 'r20a8',
    type: 'bug',
    question: 'Scenario: a Testing Library test breaks after a class rename. Which line is the test-query mistake?',
    lines: ['const button = container.querySelector(".save");', 'fireEvent.click(button);', 'expect(screen.getByText("Saved")).toBeInTheDocument();'],
    correct: 0,
    explanation: 'Prefer user-facing queries such as getByRole("button", { name: /save/i }) instead of implementation details like classes.',
  },
  'r20-2:r20b1': {
    id: 'r20b8',
    type: 'bug',
    question: 'Scenario: an async user-list test fails before the API mock resolves. Which line is the waiting mistake?',
    lines: ['render(<Users />);', 'expect(screen.getByText("Jenna")).toBeInTheDocument();'],
    correct: 1,
    explanation: 'Use await screen.findByText("Jenna") or waitFor when UI appears after asynchronous work.',
  },
  'r20-3:r20c1': {
    id: 'r20c8',
    type: 'bug',
    question: 'Scenario: a context consumer crashes only in its test. Which line is the provider setup mistake?',
    lines: ['render(<CartButton />);', 'expect(screen.getByText("0")).toBeInTheDocument();'],
    correct: 0,
    explanation: 'A component that reads context needs the matching Provider in the test wrapper, just like it does in the app.',
  },
  'r21-1:r21a1': {
    id: 'r21a8',
    type: 'bug',
    question: 'Scenario: a Supabase project exposes admin access in the browser bundle. Which line is the secret-handling mistake?',
    lines: ['const supabaseKey = "service-role-secret";', 'createClient(url, supabaseKey);'],
    correct: 0,
    explanation: 'Never put service-role secrets in client React code. Use public anon keys client-side and keep privileged work on a server.',
  },
  'r22-1:r22a1': {
    id: 'r22a8',
    type: 'bug',
    question: 'Scenario: keyboard users cannot activate a clickable save control. Which line is the accessibility mistake?',
    lines: ['<div onClick={save}>Save</div>', '// keyboard users need to trigger save too'],
    correct: 0,
    explanation: 'Use a real <button> for actions. Native buttons support keyboard, focus, and assistive technology semantics.',
  },
  'r23-1:r23a1': {
    id: 'r23a8',
    type: 'bug',
    question: 'Scenario: a Vite build cannot find the API URL in production. Which line is the environment-variable mistake?',
    lines: ['const apiUrl = process.env.API_URL;', 'fetch(apiUrl);'],
    correct: 0,
    explanation: 'Vite exposes client variables through import.meta.env and the VITE_ prefix, such as import.meta.env.VITE_API_URL.',
  },
  'r23-2:r23b1': {
    id: 'r23b8',
    type: 'bug',
    question: 'Scenario: a team spends hours optimizing components that were already fast. Which line is the profiling mistake?',
    lines: ['memoize every component before measuring', 'record Profiler results', 'optimize the slow render path'],
    correct: 0,
    explanation: 'Measure first with React DevTools or production metrics. Optimization should target proven bottlenecks.',
  },
  'r23-3:r23c1': {
    id: 'r23c8',
    type: 'bug',
    question: 'Scenario: a deployment reaches users before the pull request preview is verified. Which line is the CI/CD mistake?',
    lines: ['merge to main before preview build passes', 'run CI checks', 'promote a tested deploy'],
    correct: 0,
    explanation: 'Preview builds and CI checks should pass before merging. That keeps production deploys repeatable and reviewable.',
  },
  'r24-1:r24a1': {
    id: 'r24a8',
    type: 'bug',
    question: 'Scenario: a portfolio project looks finished but the developer cannot explain the choices. Which line is the portfolio mistake?',
    lines: ['copy tutorial code without explaining choices', 'write a README with tradeoffs', 'deploy a working demo'],
    correct: 0,
    explanation: 'Portfolio work should prove understanding. Be ready to explain state, routing, accessibility, testing, and deployment choices.',
  },
  'r2-1:r2-bug1': {
    id: 'r2bonus2',
    type: 'bug',
    question: 'Scenario: a click handler runs while the event-handling quiz renders. Which line is the event mistake?',
    lines: ['<button onClick={handleSave()}>Save</button>', 'function handleSave() {', '  setSaved(true);', '}'],
    correct: 0,
    explanation: 'Calling handleSave() runs immediately. Pass handleSave so React can call it later when the click happens.',
  },
  'r6-1:r6-code1': {
    id: 'r6bonus3',
    type: 'bug',
    question: 'Scenario: a state quiz expects the new count immediately after setting it. Which line is the same-render mistake?',
    lines: ['setCount(count + 1);', 'console.log(count);', '// expects the new value immediately'],
    correct: 1,
    explanation: 'State updates are reflected on the next render. Logging count immediately reads the current render value.',
  },
  'r15-1:r15-fill1': {
    id: 'r15bonus2',
    type: 'bug',
    question: 'Scenario: a reducer returns the same object after changing it. Which line is the reducer mistake?',
    lines: ['function reducer(state, action) {', '  state.count += 1;', '  return state;', '}'],
    correct: 1,
    explanation: 'Reducers should return a new state object instead of mutating the existing one.',
  },
  'r18-1:r18-order1': {
    id: 'r18bonus2',
    type: 'bug',
    question: 'Scenario: a lazy-loaded Settings page crashes before Suspense can help. Which line is the React.lazy mistake?',
    lines: ['const Settings = React.lazy(import("./Settings"));', 'return <Suspense fallback="Loading"><Settings /></Suspense>;'],
    correct: 0,
    explanation: 'React.lazy expects a function that returns the import promise: React.lazy(() => import("./Settings")).',
  },
});

export const REACT_QUIZ_QUALITY_TARGET_KEYS = Object.freeze(
  Object.keys(REACT_QUIZ_QUALITY_ITEMS),
);

export const REACT_QUIZ_QUALITY_ITEM_IDS = Object.freeze(
  Object.values(REACT_QUIZ_QUALITY_ITEMS).map((item) => item.id),
);

export function getReactQuizQualityKey(quiz = {}) {
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  return `${quiz.lessonId}:${questions[0]?.id || ''}`;
}

export function applyReactQuizQualityItems(quizzes = []) {
  return quizzes.map((quiz) => {
    const qualityItem = REACT_QUIZ_QUALITY_ITEMS[getReactQuizQualityKey(quiz)];
    if (!qualityItem) return quiz;

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (questions.some((question) => question?.id === qualityItem.id)) return quiz;

    return {
      ...quiz,
      questions: [...questions, qualityItem],
    };
  });
}
