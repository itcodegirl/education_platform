// ═══════════════════════════════════════════════
// BUILD PROJECTS — Curated project ideas per course
// ═══════════════════════════════════════════════


export const PROJECTS = {
  html: [
    { title:'Personal Bio Page', diff:'beginner', desc:'One-page bio with headings, paragraphs, image, skill lists, and social links. Semantic HTML throughout.', skills:['Headings','Lists','Links','Images','Semantic HTML'] },
    { title:'Recipe Collection', diff:'beginner', desc:'Multi-page recipe site. Index linking to 3+ recipes. Tables for nutrition, lists for ingredients, ordered steps.', skills:['Tables','Lists','Links','Navigation'] },
    { title:'Event Registration Form', diff:'intermediate', desc:'Complete form: text, email, date, radio, checkbox, select, textarea. Fieldsets, labels, HTML5 validation.', skills:['Forms','Validation','Fieldsets','Accessibility'] },
  ],
  css: [
    { title:'Pricing Cards', diff:'beginner', desc:'3 pricing tiers with hover effects, highlighted "popular" card, responsive Flexbox layout.', skills:['Flexbox','Hover','CSS Variables','Responsive'] },
    { title:'Dashboard Layout', diff:'intermediate', desc:'Fixed sidebar, top nav, card grid, data table. Sidebar collapses on mobile. CSS Grid page layout.', skills:['CSS Grid','Media Queries','Position','Responsive'] },
    { title:'Animated Landing Page', diff:'advanced', desc:'Marketing page with scroll animations, gradient hero, glassmorphism nav, smooth transitions.', skills:['Animations','Gradients','Backdrop-filter','Clamp()'] },
  ],
  js: [
    { title:'Color Palette Generator', diff:'beginner', desc:'Generate random hex palettes. Click to copy. Save favorites to localStorage.', skills:['DOM','Events','localStorage','Math.random'] },
    { title:'Weather App', diff:'intermediate', desc:'Fetch weather by city from public API. Temperature, conditions, 5-day forecast. Loading + error states.', skills:['Fetch','Async/Await','DOM','Error Handling'] },
    { title:'Kanban Board', diff:'advanced', desc:'Drag-and-drop task board: To Do, In Progress, Done columns. Add/edit/delete. localStorage. Filter by priority.', skills:['Drag & Drop','localStorage','Arrays','Event Delegation'] },
  ],
  react: [
    { title:'Link-in-Bio Page', diff:'beginner', desc:'Linktree-style page: name, avatar, bio, social links. Dark/light toggle with useState. Deploy to Netlify.', skills:['Components','Props','useState','CSS Modules'] },
    { title:'Movie Search App', diff:'intermediate', desc:'Search OMDB API. Results grid, detail modal, save favorites. Loading/error/empty states.', skills:['useEffect','Fetch','useState','React Router'] },
    { title:'Full-Stack Task Manager', diff:'advanced', desc:'Tasks with categories, priorities, due dates. useReducer for state, Context for theme, localStorage persistence.', skills:['useReducer','Context','Custom Hooks','localStorage'] },
  ],
};
