export function createEmptyLastPosition() {
  return {
    course: '',
    mod: '',
    les: '',
    courseId: '',
    moduleId: '',
    lessonId: '',
    isModuleQuiz: false,
    time: 0,
  };
}

export function mapLastPositionRow(row) {
  if (!row) return createEmptyLastPosition();

  return {
    course: row.course || '',
    mod: row.mod || '',
    les: row.les || '',
    courseId: row.course_id || '',
    moduleId: row.module_id || '',
    lessonId: row.lesson_id || '',
    isModuleQuiz: Boolean(row.is_module_quiz),
    time: row.updated_at ? new Date(row.updated_at).getTime() : 0,
  };
}

