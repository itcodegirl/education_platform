export const module15 = {
    id: 315,
    emoji: '🧰',
    title: 'useReducer',
    tagline: 'Complex state, simplified.',
    difficulty: 'intermediate',
    lessons: [
        {
            id: 'r15-1',
            prereqs: ['r14-1'],
            title: 'useReducer for Complex State',
            difficulty: 'intermediate',
            duration: '12 min',
            concepts: [
                'useReducer is useState for complex state logic — multiple related values.',
                'A reducer function takes (state, action) and returns new state.',
                'Actions describe WHAT happened: { type: "INCREMENT" }.',
                'dispatch sends actions to the reducer.',
                'Use when: state has many sub-values, or next state depends on previous state.'
            ],
            code: `import { useReducer } from "react";

function reducer(state, action) {
    switch (action.type) {
        case "INCREMENT": return { ...state, count: state.count + 1 };
        case "DECREMENT": return { ...state, count: state.count - 1 };
        case "SET_NAME":  return { ...state, name: action.payload };
        case "RESET":     return { count: 0, name: "" };
        default: return state;
    }
}

function App() {
    const [state, dispatch] = useReducer(reducer, { count: 0, name: "" });
    return (
        <div>
            <p>{state.name}: {state.count}</p>
            <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
            <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
            <input onChange={e =>
                dispatch({ type: "SET_NAME", payload: e.target.value })
            } />
        </div>
    );
}`,
            output: 'A counter with name input managed by useReducer.',
            tasks: ['Convert a useState component to useReducer.', 'Create a reducer with 4+ action types.', 'Dispatch actions from buttons and inputs.'],
            challenge: 'Build a shopping cart with ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, and CLEAR actions.',
            devFession: 'I had 8 useState calls in one component. useReducer consolidated them into one state object with clear actions.'
        }
    ]
};
