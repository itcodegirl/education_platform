const has = (code, str) => code.toLowerCase().includes(str.toLowerCase());
const count = (code, str) => (code.toLowerCase().match(new RegExp(str.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

export const REACT_CHALLENGES = [
  { id:'react-ch-1', title:'Counter Component', description:'Build a counter with increment, decrement, and reset using useState.', difficulty:'beginner', courseId:'react',
    starter:'// import useState\n// Build a Counter component\n// 3 buttons: +, -, Reset\n// Display the count',
    requirements:['Imports useState','Uses const [count, setCount]','Has 3 buttons with onClick','Displays count value'],
    tests:[
      { label:'imports useState', check:c=>has(c,'useState') },
      { label:'state declaration', check:c=>has(c,'const [')&&has(c,'useState(') },
      { label:'3 onClick handlers', check:c=>count(c,'onClick')>=3 },
      { label:'Displays count', check:c=>has(c,'{count}') },
    ],
    hint:'const [count, setCount] = useState(0); <button onClick={() => setCount(c => c + 1)}>+</button>',
    solution:'import { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>+</button>\n      <button onClick={() => setCount(c => c - 1)}>-</button>\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}' },

  { id:'react-ch-2', title:'Props Card Component', description:'Create a reusable Card that accepts title, description, and variant props.', difficulty:'beginner', courseId:'react',
    starter:'// Create a Card component\n// Props: title, description, variant\n// Variant changes the border color\n// Destructure props',
    requirements:['Function component','Destructures props','Uses className or style dynamically','Renders title and description'],
    tests:[
      { label:'Function component', check:c=>has(c,'function')&&has(c,'return') },
      { label:'Destructures props', check:c=>has(c,'{ title')||has(c,'{title') },
      { label:'Dynamic class/style', check:c=>has(c,'className={')|| has(c,'style={') },
      { label:'Renders props', check:c=>has(c,'{title}')&&has(c,'{description}') },
    ],
    hint:'function Card({ title, description, variant }) { return <div className={variant}>...</div> }',
    solution:'function Card({ title, description, variant = "default" }) {\n  return (\n    <div className={`card card-${variant}`}>\n      <h3>{title}</h3>\n      <p>{description}</p>\n    </div>\n  );\n}\n\n// Usage:\n// <Card title="Hello" description="World" variant="primary" />' },

  { id:'react-ch-3', title:'Toggle Component', description:'Build a toggle that switches between ON and OFF states.', difficulty:'beginner', courseId:'react',
    starter:'// useState toggle\n// Display ON or OFF\n// Button text changes based on state\n// Style changes based on state',
    requirements:['Uses useState with boolean','Conditional text rendering','onClick toggles state','Dynamic className or style'],
    tests:[
      { label:'useState(false) or useState(true)', check:c=>has(c,'useState(false)')||has(c,'useState(true)') },
      { label:'Ternary for text', check:c=>has(c,'?')&&(has(c,'"ON"')||has(c,"'ON'")||has(c,'on')||has(c,'Off')) },
      { label:'onClick toggles', check:c=>has(c,'onClick')&&(has(c,'!') || has(c,'prev')) },
      { label:'Dynamic styling', check:c=>has(c,'className={') || has(c,'style={') },
    ],
    hint:'const [isOn, setIsOn] = useState(false); onClick={() => setIsOn(prev => !prev)}',
    solution:'import { useState } from "react";\n\nfunction Toggle() {\n  const [isOn, setIsOn] = useState(false);\n  return (\n    <button\n      className={isOn ? "toggle on" : "toggle off"}\n      onClick={() => setIsOn(prev => !prev)}\n    >\n      {isOn ? "ON" : "OFF"}\n    </button>\n  );\n}' },

  { id:'react-ch-4', title:'List with Map & Keys', description:'Render an array of items with .map() and unique keys.', difficulty:'beginner', courseId:'react',
    starter:'// Array of items with id and name\n// Render as a list using .map()\n// Each item needs a unique key\n// Add a delete button per item',
    requirements:['Array state with objects','Uses .map() to render','Each element has key prop','Delete button uses filter'],
    tests:[
      { label:'Array state', check:c=>has(c,'useState([') },
      { label:'.map(', check:c=>has(c,'.map(') },
      { label:'key={', check:c=>has(c,'key={') },
      { label:'filter for delete', check:c=>has(c,'.filter(') },
    ],
    hint:'items.map(item => <li key={item.id}>{item.name} <button onClick={() => delete(item.id)}>X</button></li>)',
    solution:'import { useState } from "react";\n\nfunction ItemList() {\n  const [items, setItems] = useState([\n    { id: 1, name: "Learn React" },\n    { id: 2, name: "Build a project" },\n    { id: 3, name: "Get hired" },\n  ]);\n\n  const remove = (id) => setItems(items.filter(i => i.id !== id));\n\n  return (\n    <ul>\n      {items.map(item => (\n        <li key={item.id}>\n          {item.name}\n          <button onClick={() => remove(item.id)}>X</button>\n        </li>\n      ))}\n    </ul>\n  );\n}' },

  { id:'react-ch-5', title:'Controlled Form', description:'Build a controlled form with name and email that logs on submit.', difficulty:'beginner', courseId:'react',
    starter:'// Controlled inputs with useState\n// value={state} + onChange\n// onSubmit with preventDefault\n// Log form data on submit',
    requirements:['useState for form data','value= on inputs','onChange updates state','onSubmit with preventDefault'],
    tests:[
      { label:'useState', check:c=>has(c,'useState') },
      { label:'value={', check:c=>count(c,'value={')>=2 },
      { label:'onChange', check:c=>count(c,'onChange')>=2 },
      { label:'preventDefault', check:c=>has(c,'preventDefault') },
    ],
    hint:'const [form, setForm] = useState({name:"",email:""}); onChange: setForm({...form, [e.target.name]: e.target.value})',
    solution:'import { useState } from "react";\n\nfunction ContactForm() {\n  const [form, setForm] = useState({ name: "", email: "" });\n\n  const handleChange = (e) => {\n    setForm({ ...form, [e.target.name]: e.target.value });\n  };\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    console.log("Submitted:", form);\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />\n      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />\n      <button type="submit">Send</button>\n    </form>\n  );\n}' },

  { id:'react-ch-6', title:'useEffect Data Fetch', description:'Fetch and display data with loading and error states.', difficulty:'intermediate', courseId:'react',
    starter:'// Fetch users from jsonplaceholder\n// Show loading while fetching\n// Show error if it fails\n// Display user names',
    requirements:['useEffect with empty []','Loading state','Error state','Renders data after fetch'],
    tests:[
      { label:'useEffect', check:c=>has(c,'useEffect') },
      { label:'Loading state', check:c=>has(c,'loading')||has(c,'Loading') },
      { label:'Error handling', check:c=>has(c,'error')||has(c,'catch') },
      { label:'Renders data', check:c=>has(c,'.map(')&&has(c,'key={') },
    ],
    hint:'useEffect(() => { fetch(url).then(r=>r.json()).then(setData).catch(setError).finally(()=>setLoading(false)) }, [])',
    solution:'import { useState, useEffect } from "react";\n\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    fetch("https://jsonplaceholder.typicode.com/users")\n      .then(res => res.json())\n      .then(setUsers)\n      .catch(err => setError(err.message))\n      .finally(() => setLoading(false));\n  }, []);\n\n  if (loading) return <p>Loading...</p>;\n  if (error) return <p>Error: {error}</p>;\n  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n}' },

  { id:'react-ch-7', title:'Context Theme Provider', description:'Create a theme context with toggle and consume it in a component.', difficulty:'intermediate', courseId:'react',
    starter:'// createContext for theme\n// ThemeProvider with useState\n// Toggle function\n// Child component uses useContext',
    requirements:['createContext','Provider with value','useContext in child','Toggle function'],
    tests:[
      { label:'createContext', check:c=>has(c,'createContext') },
      { label:'Provider', check:c=>has(c,'.Provider') },
      { label:'useContext', check:c=>has(c,'useContext') },
      { label:'Toggle logic', check:c=>has(c,'toggle')||has(c,'dark')&&has(c,'light') },
    ],
    hint:'const ThemeContext = createContext(); function ThemeProvider({ children }) { ... return <ThemeContext.Provider value={{theme, toggle}}>',
    solution:'import { createContext, useContext, useState } from "react";\n\nconst ThemeContext = createContext();\n\nfunction ThemeProvider({ children }) {\n  const [theme, setTheme] = useState("dark");\n  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");\n  return (\n    <ThemeContext.Provider value={{ theme, toggle }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n}\n\nfunction Header() {\n  const { theme, toggle } = useContext(ThemeContext);\n  return <button onClick={toggle}>Theme: {theme}</button>;\n}' },

  { id:'react-ch-8', title:'Custom useFetch Hook', description:'Extract data fetching logic into a reusable custom hook.', difficulty:'intermediate', courseId:'react',
    starter:'// Create useFetch(url) hook\n// Returns { data, loading, error }\n// Uses useState + useEffect\n// Use it in a component',
    requirements:['Function starts with "use"','Returns { data, loading, error }','Uses useState and useEffect','Reusable with any URL'],
    tests:[
      { label:'Named useFetch', check:c=>has(c,'function useFetch')||has(c,'const useFetch') },
      { label:'Returns object', check:c=>has(c,'return {')&&has(c,'data')&&has(c,'loading') },
      { label:'useState', check:c=>count(c,'useState')>=2 },
      { label:'useEffect with url dep', check:c=>has(c,'useEffect')&&has(c,'[url]') },
    ],
    hint:'function useFetch(url) { const [data, setData] = useState(null); useEffect(() => { fetch(url)... }, [url]); return { data, loading, error }; }',
    solution:'import { useState, useEffect } from "react";\n\nfunction useFetch(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    setLoading(true);\n    fetch(url)\n      .then(res => res.json())\n      .then(setData)\n      .catch(err => setError(err.message))\n      .finally(() => setLoading(false));\n  }, [url]);\n\n  return { data, loading, error };\n}\n\n// Usage:\n// const { data, loading } = useFetch("/api/users");' },

  { id:'react-ch-9', title:'useReducer Todo', description:'Build a todo app with useReducer for state management.', difficulty:'intermediate', courseId:'react',
    starter:'// useReducer with actions:\n// ADD_TODO, TOGGLE_TODO, DELETE_TODO\n// reducer function with switch\n// dispatch actions from UI',
    requirements:['Uses useReducer','Reducer with switch/case','3+ action types','dispatch() calls'],
    tests:[
      { label:'useReducer', check:c=>has(c,'useReducer') },
      { label:'switch statement', check:c=>has(c,'switch') },
      { label:'3+ action types', check:c=>count(c,"case '")>=3||count(c,'case "')>=3 },
      { label:'dispatch(', check:c=>count(c,'dispatch(')>=2 },
    ],
    hint:'function reducer(state, action) { switch(action.type) { case "ADD": return [...state, action.payload]; } }',
    solution:'import { useReducer } from "react";\n\nfunction reducer(state, action) {\n  switch (action.type) {\n    case "ADD": return [...state, { id: Date.now(), text: action.text, done: false }];\n    case "TOGGLE": return state.map(t => t.id === action.id ? { ...t, done: !t.done } : t);\n    case "DELETE": return state.filter(t => t.id !== action.id);\n    default: return state;\n  }\n}\n\nfunction TodoApp() {\n  const [todos, dispatch] = useReducer(reducer, []);\n  return (\n    <div>\n      <button onClick={() => dispatch({ type: "ADD", text: "New todo" })}>Add</button>\n      {todos.map(t => (\n        <div key={t.id}>\n          <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>\n          <button onClick={() => dispatch({ type: "TOGGLE", id: t.id })}>Toggle</button>\n          <button onClick={() => dispatch({ type: "DELETE", id: t.id })}>Delete</button>\n        </div>\n      ))}\n    </div>\n  );\n}' },

  { id:'react-ch-10', title:'Lazy Loading with Suspense', description:'Code-split a heavy component with React.lazy and Suspense.', difficulty:'advanced', courseId:'react',
    starter:'// Lazy load a component\n// Wrap with Suspense\n// Show fallback while loading\n// Conditionally render',
    requirements:['Uses React.lazy()','Uses Suspense','Has fallback prop','Conditional rendering'],
    tests:[
      { label:'React.lazy or lazy', check:c=>has(c,'lazy(') },
      { label:'Suspense', check:c=>has(c,'Suspense')||has(c,'suspense') },
      { label:'fallback=', check:c=>has(c,'fallback=') },
      { label:'Dynamic import', check:c=>has(c,'import(') },
    ],
    hint:'const Heavy = lazy(() => import("./HeavyComponent")); <Suspense fallback={<p>Loading...</p>}><Heavy /></Suspense>',
    solution:'import { lazy, Suspense, useState } from "react";\n\nconst HeavyChart = lazy(() => import("./HeavyChart"));\n\nfunction App() {\n  const [show, setShow] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setShow(true)}>Load Chart</button>\n      {show && (\n        <Suspense fallback={<p>Loading chart...</p>}>\n          <HeavyChart />\n        </Suspense>\n      )}\n    </div>\n  );\n}' },
];
