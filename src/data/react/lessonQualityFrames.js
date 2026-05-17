const REACT_LESSON_QUALITY_FRAMES = Object.freeze({
  'r1-1': {
    learningFrame: {
      learn: 'Use React to describe interactive UI as reusable components instead of manual DOM steps.',
      check: 'Without looking back, explain why React re-renders from state instead of using document.createElement everywhere.',
      next: 'Apply this mental model when you compare JSX, components, props, and state in the next fundamentals lessons.',
    },
    commonMistakes: ['Common mistake: Treating React as a replacement for JavaScript instead of a JavaScript UI library.'],
  },
  'r1-2': {
    learningFrame: {
      learn: 'Write JSX that mixes markup-like structure with JavaScript expressions safely.',
      check: 'Without looking back, explain why JSX uses className and one parent wrapper.',
      next: 'Use JSX fluency to make your first reusable components easier to read and debug.',
    },
    commonMistakes: ['Common mistake: Copying HTML directly into JSX without fixing className, self-closing tags, or expression syntax.'],
  },
  'r1-3': {
    learningFrame: {
      learn: 'Break a UI into small named components that can be composed into a full page.',
      check: 'Without looking back, explain why component names start with capital letters.',
      next: 'Apply component composition before adding props so each piece has one clear job.',
    },
    commonMistakes: ['Common mistake: Letting one component own every section of the page instead of splitting by responsibility.'],
  },
  'r1-4': {
    learningFrame: {
      learn: 'Pass data into components with props so one component can render many variations.',
      check: 'Without looking back, explain why child components should not mutate props.',
      next: 'Use props with state next so parent components can own data and children can render it.',
    },
    commonMistakes: ['Common mistake: Trying to change props inside the child instead of asking the parent to update state.'],
  },
  'r1-5': {
    learningFrame: {
      learn: 'Use useState to store component memory and trigger UI updates from user actions.',
      check: 'Without looking back, explain when to use the setter function instead of changing a variable directly.',
      next: 'Apply state to events, forms, and lists so your components respond to real users.',
    },
    commonMistakes: ['Common mistake: Mutating state directly and wondering why React does not update the screen.'],
  },
  'r2-1': {
    learningFrame: {
      learn: 'Connect user actions to state changes with React event handlers.',
      check: 'Without looking back, explain the difference between onClick={handleClick} and onClick={handleClick()}.',
      next: 'Use events as the bridge into controlled forms, filters, toggles, and interactive project features.',
    },
    commonMistakes: ['Common mistake: Calling the handler during render instead of passing the function for React to call later.'],
  },
  'r2-3': {
    learningFrame: {
      learn: 'Render arrays as UI with map while giving React stable keys for each item.',
      check: 'Without looking back, explain why array indexes are risky keys when a list can reorder or delete items.',
      next: 'Apply list rendering in project screens such as contacts, tasks, favorites, and search results.',
    },
    commonMistakes: ['Common mistake: Ignoring key warnings until list items start reusing the wrong state after edits.'],
  },
  'r2-5': {
    learningFrame: {
      learn: 'Combine components, state, forms, conditionals, and mock async data into a weather dashboard.',
      check: 'Without looking back, explain which component should own weather, loading, error, and favorites state.',
      next: 'Use this project pattern when building dashboards that search, fetch, save, and display changing data.',
    },
    commonMistakes: ['Common mistake: Putting all dashboard logic in the display component instead of separating search, data, and saved items.'],
  },
  'r2-6': {
    learningFrame: {
      learn: 'Build a CRUD task manager with immutable array updates, filters, and localStorage persistence.',
      check: 'Without looking back, explain why filter and map are safer than mutating the tasks array.',
      next: 'Apply this project structure to portfolio tools such as habit trackers, issue lists, and planning boards.',
    },
    commonMistakes: ['Common mistake: Reusing the same array reference after push, splice, or direct assignment.'],
  },
  'r2-7': {
    learningFrame: {
      learn: 'Summarize the React fundamentals you can now use in a complete beginner project.',
      check: 'Without looking back, explain how props, state, events, and lists work together in one app.',
      next: 'Apply the fundamentals by polishing one project before moving into professional component patterns.',
    },
    commonMistakes: ['Common mistake: Moving ahead before you can rebuild a small feature from memory.'],
  },
  'r9-1': {
    learningFrame: {
      learn: 'Use useEffect to synchronize React with timers, APIs, subscriptions, and browser APIs after render.',
      check: 'Without looking back, explain what changes when an effect has no dependency array, an empty array, or dependencies.',
      next: 'Apply effect timing before fetching real data so side effects do not run on every render by accident.',
    },
    commonMistakes: ['Common mistake: Using useEffect as a second render function instead of a sync point with outside systems.'],
  },
  'r9-2': {
    learningFrame: {
      learn: 'Fetch data with loading, error, and success states that keep the UI understandable.',
      check: 'Without looking back, explain where try/catch, res.ok, and cleanup belong in an async fetch flow.',
      next: 'Apply the fetch pattern to dashboards, profile pages, and admin screens that rely on remote data.',
    },
    commonMistakes: ['Common mistake: Rendering fetched data before checking loading, error, or the actual response shape.'],
  },
  'r9-3': {
    learningFrame: {
      learn: 'Extract repeated stateful logic into custom hooks that start with use.',
      check: 'Without looking back, explain why a function that calls hooks must be a component or custom hook.',
      next: 'Apply custom hooks to reuse fetch, localStorage, debounce, and window-size behavior across projects.',
    },
    commonMistakes: ['Common mistake: Naming a hook-like function without the use prefix, which hides hook rule problems from tooling.'],
  },
  'r15-1': {
    learningFrame: {
      learn: 'Use useReducer when state changes have multiple action types or related values.',
      check: 'Without looking back, explain how state plus an action becomes the next state.',
      next: 'Apply reducers before adding Context so complex app state has predictable transitions.',
    },
    commonMistakes: ['Common mistake: Mutating reducer state and returning the same object instead of a new state reference.'],
  },
  'r15-2': {
    learningFrame: {
      learn: 'Use Context to share app-level data without drilling props through every layer.',
      check: 'Without looking back, explain what a Provider value gives to consumers.',
      next: 'Apply Context to shared state such as auth, theme, cart, and app preferences.',
    },
    commonMistakes: ['Common mistake: Putting every changing value into one Context and causing unrelated consumers to re-render.'],
  },
  'r15-3': {
    learningFrame: {
      learn: 'Combine Context and useReducer into a predictable global state pattern.',
      check: 'Without looking back, explain why components dispatch actions instead of editing shared state directly.',
      next: 'Apply this pattern to carts, chat state, notification systems, and admin workflows.',
    },
    commonMistakes: ['Common mistake: Exposing raw state mutation helpers instead of a focused action API.'],
  },
  'r16-1': {
    learningFrame: {
      learn: 'Use memoization tools only where prop stability or expensive calculations actually matter.',
      check: 'Without looking back, explain the difference between React.memo, useMemo, and useCallback.',
      next: 'Apply profiling first, then optimize the components that create visible slowdowns.',
    },
    commonMistakes: ['Common mistake: Memoizing every component before measuring whether renders are actually expensive.'],
  },
  'r16-3': {
    learningFrame: {
      learn: 'Render very large lists with virtualization so the DOM only contains visible rows.',
      check: 'Without looking back, explain why rendering 100000 rows at once freezes the page.',
      next: 'Apply virtualization to data grids, logs, search results, and long admin tables.',
    },
    commonMistakes: ['Common mistake: Solving large-list lag with more memoization while still rendering every row.'],
  },
  'r13-1': {
    learningFrame: {
      learn: 'Create client-side routes that move between screens without a full page reload.',
      check: 'Without looking back, explain why Link is different from a plain anchor in a React Router app.',
      next: 'Apply routing to dashboards, detail pages, and project navigation before adding protected routes.',
    },
    commonMistakes: ['Common mistake: Using <a href> for internal navigation and accidentally resetting app state.'],
  },
  'r13-2': {
    learningFrame: {
      learn: 'Guard private routes while auth state is loading, missing, or unauthorized.',
      check: 'Without looking back, explain why protected routes need a loading state before redirecting.',
      next: 'Apply route guards to admin screens, account pages, and dashboard areas that require roles.',
    },
    commonMistakes: ['Common mistake: Redirecting before the session check finishes, which creates false login flashes.'],
  },
  'r8-2': {
    learningFrame: {
      learn: 'Use React Hook Form and Yup to validate forms without hand-writing every field check.',
      check: 'Without looking back, explain what the resolver contributes to a validated form.',
      next: 'Apply schema validation to signup, profile, checkout, and onboarding forms.',
    },
    commonMistakes: ['Common mistake: Duplicating validation rules in the UI and schema until the two disagree.'],
  },
  'r8-3': {
    learningFrame: {
      learn: 'Split long forms into steps while keeping progress, validation, and collected data organized.',
      check: 'Without looking back, explain what state must persist when a learner moves between form steps.',
      next: 'Apply multi-step forms to onboarding, surveys, applications, and checkout flows.',
    },
    commonMistakes: ['Common mistake: Validating the final form only after users have already moved through broken earlier steps.'],
  },
  'r19-2': {
    learningFrame: {
      learn: 'Use the children prop to make flexible wrapper components without hard-coding their inner content.',
      check: 'Without looking back, explain when children is clearer than another named prop.',
      next: 'Apply children to cards, panels, modals, layouts, and reusable page shells.',
    },
    commonMistakes: ['Common mistake: Making wrapper components so generic that callers cannot tell what belongs inside.'],
  },
  'r19-3': {
    learningFrame: {
      learn: 'Lift shared state to the closest common parent so sibling components stay in sync.',
      check: 'Without looking back, explain which component should own state that two children both need.',
      next: 'Apply lifted state before reaching for Context or global stores.',
    },
    commonMistakes: ['Common mistake: Duplicating the same state in siblings and trying to manually keep both copies synchronized.'],
  },
  'r19-4': {
    learningFrame: {
      learn: 'Recognize prop drilling and decide when composition or Context is the better escape hatch.',
      check: 'Without looking back, explain the difference between normal prop passing and prop drilling pain.',
      next: 'Apply the smallest state-sharing tool that keeps the component tree understandable.',
    },
    commonMistakes: ['Common mistake: Reaching for global state before checking whether composition would remove the drilling.'],
  },
  'r19-6': {
    learningFrame: {
      learn: 'Use effects to model mount, update, and cleanup behavior in function components.',
      check: 'Without looking back, explain when an effect cleanup function runs.',
      next: 'Apply lifecycle thinking to subscriptions, timers, sockets, and browser event listeners.',
    },
    commonMistakes: ['Common mistake: Leaving subscriptions or timers active after a component unmounts.'],
  },
  'r19-7': {
    learningFrame: {
      learn: 'Build a real-time chat interface by separating message state from presentation components.',
      check: 'Without looking back, explain which component should own messages, typing state, and send behavior.',
      next: 'Apply this structure to collaborative tools, comments, notifications, and support chat features.',
    },
    commonMistakes: ['Common mistake: Letting each message component own shared chat state instead of passing focused props.'],
  },
  'r19-8': {
    learningFrame: {
      learn: 'Structure a blog platform with containers, presentational pieces, filters, and detail views.',
      check: 'Without looking back, explain which logic belongs in the blog container instead of the post card.',
      next: 'Apply this architecture to portfolio case studies, documentation, and content dashboards.',
    },
    commonMistakes: ['Common mistake: Mixing fetch, filter, edit, and rendering logic inside one PostCard.'],
  },
  'r19-9': {
    learningFrame: {
      learn: 'Review component design patterns and identify which ones are ready for portfolio use.',
      check: 'Without looking back, explain one pattern you would use in a real project and why.',
      next: 'Apply one pattern to refactor a previous project before moving into tests.',
    },
    commonMistakes: ['Common mistake: Learning pattern names without practicing the tradeoff each pattern solves.'],
  },
  'r20-1': {
    learningFrame: {
      learn: 'Write tests that check user-visible behavior with Jest or Vitest and React Testing Library.',
      check: 'Without looking back, explain why tests should query the UI the way a user experiences it.',
      next: 'Apply basic tests to forms, buttons, conditionals, and list rendering before async flows.',
    },
    commonMistakes: ['Common mistake: Testing implementation details instead of the behavior users and reviewers care about.'],
  },
  'r20-2': {
    learningFrame: {
      learn: 'Test async UI by mocking API calls and waiting for loading, success, and error states.',
      check: 'Without looking back, explain why async tests need waitFor or findBy queries.',
      next: 'Apply async test coverage to data-fetching dashboards, admin tables, and search flows.',
    },
    commonMistakes: ['Common mistake: Asserting immediately after a click before the async UI has had time to update.'],
  },
  'r20-3': {
    learningFrame: {
      learn: 'Test hooks, Context, and integrated flows with realistic wrappers and user actions.',
      check: 'Without looking back, explain when a test needs a Provider wrapper.',
      next: 'Apply integration tests to the flows that prove your app works end to end.',
    },
    commonMistakes: ['Common mistake: Mocking so much context that the test no longer covers the real contract.'],
  },
  'r23-1': {
    learningFrame: {
      learn: 'Use Vite and modern build tooling to run, bundle, and preview a React app reliably.',
      check: 'Without looking back, explain what npm run dev does differently from npm run build.',
      next: 'Apply build-tool confidence before optimizing production bundles or configuring deploys.',
    },
    commonMistakes: ['Common mistake: Shipping assumptions from the dev server without checking the production build output.'],
  },
  'r23-2': {
    learningFrame: {
      learn: 'Optimize production React apps by reading bundle output and splitting expensive code.',
      check: 'Without looking back, explain why lazy chunks can help initial load but still need budgets.',
      next: 'Apply production optimization to preview deploys, route chunks, and performance reviews.',
    },
    commonMistakes: ['Common mistake: Chasing tiny minification gains while a route-level lazy chunk would remove much more startup cost.'],
  },
  'r23-3': {
    learningFrame: {
      learn: 'Deploy React apps through CI/CD with repeatable checks, environment variables, and rollback awareness.',
      check: 'Without looking back, explain which checks should pass before a production deploy.',
      next: 'Apply this workflow to every portfolio project so reviewers can trust the release process.',
    },
    commonMistakes: ['Common mistake: Treating a manual successful deploy as proof that the next deploy will be repeatable.'],
  },
});

export const REACT_LESSON_QUALITY_FRAME_IDS = Object.freeze(
  Object.keys(REACT_LESSON_QUALITY_FRAMES),
);

function mergeLearningFrame(lessonFrame = {}, qualityFrame = {}) {
  return {
    ...qualityFrame,
    ...lessonFrame,
  };
}

function mergeCommonMistakes(lessonMistakes, qualityMistakes = []) {
  const mistakes = [
    ...(Array.isArray(lessonMistakes) ? lessonMistakes : []),
    ...qualityMistakes,
  ].filter(Boolean);

  return [...new Set(mistakes)];
}

export function applyReactLessonQualityFrames(modules = []) {
  return modules.map((moduleData) => ({
    ...moduleData,
    lessons: (moduleData.lessons || []).map((lesson) => {
      const qualityFrame = REACT_LESSON_QUALITY_FRAMES[lesson.id];
      if (!qualityFrame) return lesson;

      return {
        ...lesson,
        learningFrame: mergeLearningFrame(lesson.learningFrame, qualityFrame.learningFrame),
        commonMistakes: mergeCommonMistakes(lesson.commonMistakes, qualityFrame.commonMistakes),
      };
    }),
  }));
}
