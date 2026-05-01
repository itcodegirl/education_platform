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
