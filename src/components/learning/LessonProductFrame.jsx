import {
  getLessonProductFrame,
  LESSON_PRODUCT_FRAME_FIELDS,
} from '../../utils/lessonProductFrame';

export function LessonProductFrame({ lesson, nextTitle }) {
  const frame = getLessonProductFrame(lesson, { nextTitle });

  return (
    <section className="lesson-product-frame" aria-label="Lesson learning frame">
      {LESSON_PRODUCT_FRAME_FIELDS.map(({ key, label }) => (
        <div key={key} className="lesson-product-frame-item">
          <h2 className="lesson-product-frame-label">{label}</h2>
          <p className="lesson-product-frame-copy">{frame[key]}</p>
        </div>
      ))}
    </section>
  );
}
