export const COURSE_ORPHAN_CLASSIFICATION_POLICIES = Object.freeze({});

export const LESSON_QUIZ_ORPHAN_CLASSIFICATIONS = Object.freeze({
  'o:html:h2-1': {
    classification: 'possible-reuse-later',
    reason: 'Legacy VS Code setup quiz could support a future tooling checkpoint.',
  },
  'o:html:h2-2': {
    classification: 'possible-reuse-later',
    reason: 'Legacy DevTools quiz could support a future tooling checkpoint.',
  },
  'o:html:h3-2': {
    classification: 'possible-reuse-later',
    reason: 'Legacy metadata quiz is still relevant but not part of active frontend coverage.',
  },
  'o:html:h11-1': {
    classification: 'possible-reuse-later',
    reason: 'Legacy div/span quiz could support a future HTML structure refresher.',
  },
  'o:html:h13-2': {
    classification: 'future-advanced-content',
    reason: 'ARIA label quiz fits future accessibility depth rather than current beginner coverage.',
  },
  'o:html:h14-1': {
    classification: 'stale',
    reason: 'SEO title-length quiz was removed from lesson-12 mapping and needs fresh review before reuse.',
  },
  'o:html:h15-1': {
    classification: 'legacy-archived',
    reason: 'File-organization quiz was intentionally removed from lesson-12 capstone mapping.',
  },
  'o:html:h16-1': {
    classification: 'possible-reuse-later',
    reason: 'DevTools permanence quiz could support a future debugging checkpoint.',
  },
  'o:html:h17-1': {
    classification: 'possible-reuse-later',
    reason: 'Heading-structure quiz remains useful but is outside the current active lesson map.',
  },
  'o:html:h18-1': {
    classification: 'legacy-archived',
    reason: 'Validation quiz was intentionally removed from lesson-12 capstone mapping.',
  },
  'o:html:h19-1': {
    classification: 'future-advanced-content',
    reason: 'Data-attribute quiz belongs with future HTML and JavaScript integration depth.',
  },
  'o:html:h19-2': {
    classification: 'future-advanced-content',
    reason: 'Template-element quiz belongs with future advanced HTML patterns.',
  },
  'o:html:h20-1': {
    classification: 'future-advanced-content',
    reason: 'JavaScript hook quiz belongs with future HTML and JavaScript integration depth.',
  },

  'o:css:c2-1': {
    classification: 'legacy-archived',
    reason: 'Legacy CSS rule-syntax quiz is superseded by active beginner CSS coverage.',
  },
  'o:css:c2-3': {
    classification: 'legacy-archived',
    reason: 'Legacy typo/debugging quiz is superseded by active beginner CSS coverage.',
  },
  'o:css:c3-2': {
    classification: 'possible-reuse-later',
    reason: 'Descendant selector quiz could support a future selector refresher.',
  },
  'o:css:c4-1': {
    classification: 'legacy-archived',
    reason: 'Legacy color quiz is superseded by active beginner CSS coverage.',
  },
  'o:css:c4-3': {
    classification: 'legacy-archived',
    reason: 'Legacy font-weight quiz is superseded by active beginner CSS coverage.',
  },
  'o:css:c5-2': {
    classification: 'possible-reuse-later',
    reason: 'Responsive media sizing quiz could support a future media checkpoint.',
  },
  'o:css:c5-3': {
    classification: 'possible-reuse-later',
    reason: 'Overflow quiz could support a future layout troubleshooting checkpoint.',
  },
  'o:css:c7-2': {
    classification: 'legacy-archived',
    reason: 'Legacy background-size quiz is superseded by active background-image coverage.',
  },
  'o:css:c8-2': {
    classification: 'possible-reuse-later',
    reason: 'Specificity quiz could support future cascade review.',
  },
  'o:css:c8-3': {
    classification: 'possible-reuse-later',
    reason: 'Reset quiz could support future cascade and normalization review.',
  },
  'o:css:c9-1': {
    classification: 'possible-reuse-later',
    reason: 'Focus-state quiz could support future forms and accessibility review.',
  },
  'o:css:c9-2': {
    classification: 'possible-reuse-later',
    reason: 'List-style quiz could support future navigation pattern review.',
  },
  'o:css:c9-3': {
    classification: 'future-advanced-content',
    reason: 'BEM quiz fits future maintainable CSS architecture content.',
  },
  'o:css:c10-1': {
    classification: 'future-advanced-content',
    reason: 'Reduced-motion quiz fits future accessibility and motion depth.',
  },
  'o:css:c10-2': {
    classification: 'future-advanced-content',
    reason: 'DevTools cascade quiz fits future debugging depth.',
  },

  'o:js:j2-1': {
    classification: 'legacy-archived',
    reason: 'Legacy const quiz is superseded by active JavaScript fundamentals coverage.',
  },
  'o:js:j2-2': {
    classification: 'legacy-archived',
    reason: 'Legacy typeof quiz is superseded by active JavaScript fundamentals coverage.',
  },
  'o:js:j2-3': {
    classification: 'legacy-archived',
    reason: 'Legacy coercion quiz is superseded by active JavaScript fundamentals coverage.',
  },
  'o:js:j9-1': {
    classification: 'possible-reuse-later',
    reason: 'querySelector quiz could support future DOM refresher content.',
  },
  'o:js:j9-3': {
    classification: 'future-advanced-content',
    reason: 'innerHTML safety quiz fits future security-minded DOM coverage.',
  },
  'o:js:j11-1': {
    classification: 'possible-reuse-later',
    reason: 'let/const scope quiz could support future fundamentals review.',
  },
  'o:js:j11-2': {
    classification: 'possible-reuse-later',
    reason: 'Hoisting quiz could support future scope and execution-context review.',
  },
  'o:js:j13-1': {
    classification: 'possible-reuse-later',
    reason: 'JSON.stringify quiz could support future API/data handling review.',
  },
  'o:js:j14-2': {
    classification: 'possible-reuse-later',
    reason: 'console.table quiz could support future debugging workflow review.',
  },
  'o:js:j15-1': {
    classification: 'future-advanced-content',
    reason: 'this binding quiz fits future intermediate JavaScript depth.',
  },
  'o:js:j16-1': {
    classification: 'future-advanced-content',
    reason: 'Class syntax quiz fits future intermediate JavaScript depth.',
  },
  'o:js:j19-1': {
    classification: 'possible-reuse-later',
    reason: 'Optional chaining quiz could support future modern syntax review.',
  },
  'o:js:j20-1': {
    classification: 'future-advanced-content',
    reason: 'Debouncing quiz fits future performance and interaction-depth content.',
  },
  'o:js:j22-1': {
    classification: 'possible-reuse-later',
    reason: 'Planning quiz could support future capstone readiness checkpoints.',
  },

  'o:react:r2-1': {
    classification: 'legacy-archived',
    reason: 'Legacy JSX quiz was kept out of active mapping after wrong-topic React repairs.',
  },
  'o:react:r6-2': {
    classification: 'possible-reuse-later',
    reason: 'Object state quiz could support a future state immutability refresher.',
  },
  'o:react:r10-1': {
    classification: 'possible-reuse-later',
    reason: 'useRef quiz could support future hooks review.',
  },
  'o:react:r11-2': {
    classification: 'possible-reuse-later',
    reason: 'Props quiz could support future component fundamentals review.',
  },
  'o:react:r12-1': {
    classification: 'possible-reuse-later',
    reason: 'CSS Modules quiz could support future styling review.',
  },
  'o:react:r17-1': {
    classification: 'future-advanced-content',
    reason: 'Error boundary quiz fits future advanced React reliability content.',
  },
  'o:react:r18-2': {
    classification: 'future-advanced-content',
    reason: 'Portal quiz fits future advanced rendering-pattern content.',
  },
  'o:react:r21-1': {
    classification: 'future-advanced-content',
    reason: 'Supabase quiz fits future backend integration depth.',
  },
  'o:react:r22-1': {
    classification: 'future-advanced-content',
    reason: 'Interactive div accessibility quiz fits future React accessibility depth.',
  },
  'o:react:r24-1': {
    classification: 'possible-reuse-later',
    reason: 'Portfolio code-quality quiz could support future portfolio-readiness checkpoints.',
  },
});

export const INTENTIONAL_LESSON_QUIZ_VARIANTS = Object.freeze({
  'l:html:lesson-01': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['h3-1']),
    bonusRawLessonIds: Object.freeze(['h4-1', 'h4-2', 'h5-1']),
    reason:
      'Reviewed as beginner HTML reinforcement; primary covers document structure while bonus quizzes reinforce early tags, headings, and attributes.',
  },
  'l:html:lesson-05': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['h12-1']),
    bonusRawLessonIds: Object.freeze(['h12-2', 'h12-3']),
    reason:
      'Reviewed after duplicate HTML lesson identity repair; lesson-05 is the Forms lesson and all variants cover form controls, labels, inputs, or validation.',
  },
  'l:html:lesson-08': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['h5-2']),
    bonusRawLessonIds: Object.freeze(['h5-3']),
    reason: 'Reviewed legacy HTML text-formatting split; keep the second quiz as bonus reinforcement.',
  },
  'l:html:lesson-03': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['h7-1']),
    bonusRawLessonIds: Object.freeze(['h13-1']),
    reason: 'Reviewed image/media-adjacent legacy coverage; keep the second quiz as bonus reinforcement.',
  },
  'l:html:lesson-07': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['h10-1']),
    bonusRawLessonIds: Object.freeze(['h10-2']),
    reason: 'Reviewed semantic HTML pair; keep the second quiz as bonus reinforcement.',
  },
  'l:js:js-2-3': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['j8-1']),
    bonusRawLessonIds: Object.freeze(['j8-2']),
    reason: 'Reviewed objects lesson split; keep the second quiz as bonus reinforcement.',
  },
  'l:js:js-3-2': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['j9-2']),
    bonusRawLessonIds: Object.freeze(['j10-1']),
    reason: 'Reviewed DOM interaction split; keep the second quiz as bonus reinforcement.',
  },
  'l:js:js-5-2': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['j12-2']),
    bonusRawLessonIds: Object.freeze(['j12-3']),
    reason: 'Reviewed async/await pair; keep the second quiz as bonus reinforcement.',
  },
  'l:js:js-5-3': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['j14-1']),
    bonusRawLessonIds: Object.freeze(['j21-3']),
    reason: 'Reviewed loading/error-state coverage; keep the second quiz as bonus reinforcement.',
  },
  'l:react:r1-5': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['r6-1']),
    bonusRawLessonIds: Object.freeze(['r6-1']),
    reason: 'Reviewed useState primary quiz plus short code/fill checkpoint.',
  },
  'l:react:r2-3': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['r7-2']),
    bonusRawLessonIds: Object.freeze(['r7-2']),
    reason: 'Reviewed lists/keys primary quiz plus short bug-spot checkpoint.',
  },
  'l:react:r9-1': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['r9-1']),
    bonusRawLessonIds: Object.freeze(['r9-1']),
    reason: 'Reviewed useEffect primary quiz plus short dependency checkpoint.',
  },
  'l:react:r15-1': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['r15-1']),
    bonusRawLessonIds: Object.freeze(['r15-1']),
    reason: 'Reviewed useReducer primary quiz plus short dispatch checkpoint.',
  },
  'l:react:r16-2': {
    status: 'intentional',
    primaryRawLessonIds: Object.freeze(['r18-1']),
    bonusRawLessonIds: Object.freeze(['r18-1']),
    reason: 'Reviewed code-splitting primary quiz plus short ordering checkpoint.',
  },
});
