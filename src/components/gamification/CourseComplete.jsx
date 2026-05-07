import { useEffect, useRef, useState } from 'react';
import { generateProgressSummary } from '../../utils/progressSummary';
import { useToast } from '../shared/Toast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PROGRESS_SUMMARY_COPY, PROGRESS_SYNC_COPY } from '../../constants/progressCopy';

// Curriculum order (HTML → CSS → JS → React) doubles as the natural
// "what's next" recommendation. The pure helper is exported so the
// recommendation can be unit-tested without mounting the dialog.
export function getNextRecommendedTrack(currentCourseId, courses) {
  if (!Array.isArray(courses) || courses.length === 0) return null;
  const idx = courses.findIndex((c) => c.id === currentCourseId);
  if (idx === -1 || idx >= courses.length - 1) return null;
  return courses[idx + 1] || null;
}

export function CourseComplete({ isOpen, onClose, course, displayName, lessonCount, courses, onSelectNextCourse }) {
  const [show, setShow] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timer);
    }

    setShow(false);
    return undefined;
  }, [isOpen]);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nextTrack = getNextRecommendedTrack(course?.id, courses);
  const handleStartNextTrack = () => {
    if (typeof onSelectNextCourse === 'function' && nextTrack) {
      onSelectNextCourse(nextTrack.id);
    }
    onClose();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateProgressSummary({
        studentName: displayName || 'Learner',
        courseName: course.label,
        courseId: course.id,
        lessonCount,
        completionDate: today,
      });
    } catch {
      toast.show('Progress Summary failed — try again in a moment.');
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <div className="cc-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`cc-card ${show ? 'show' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-course-title"
        aria-describedby="cc-course-desc cc-course-kicker cc-progress-sync"
        tabIndex={-1}
      >
        <div className="cc-badge-row">
          <span className="cc-trophy" aria-hidden="true">{course.icon}</span>
        </div>

        <div className="cc-header">
          <span className="cc-overline">Completion noted</span>
          <h2 id="cc-course-title" className="cc-title">Course lessons complete</h2>
          <p id="cc-course-desc" className="cc-sub">
            You marked all {lessonCount} lessons in <strong>{course.label}</strong> as done.
          </p>
          <p id="cc-course-kicker" className="cc-kicker">
            This completion milestone shows that you stayed with the work long enough
            to turn effort into visible progress.
          </p>
          <p id="cc-progress-sync" className="cc-kicker">
            {PROGRESS_SYNC_COPY} {PROGRESS_SUMMARY_COPY} This is learner progress, not a third-party certificate.
          </p>
        </div>

        <div className="cc-cert">
          <div className="cc-cert-inner">
            <div className="cc-cert-border" style={{ borderColor: course.accent }} />
            <div className="cc-cert-icon">{course.icon}</div>
            <div className="cc-cert-label">Progress Summary</div>
            <div className="cc-cert-course" style={{ color: course.accent }}>
              {course.label}
            </div>
            <div className="cc-cert-name">{displayName || 'Learner'}</div>
            <div className="cc-cert-detail">Completed all {lessonCount} lessons in current app progress</div>
            <div className="cc-cert-date">{today}</div>
            <div className="cc-cert-note">Not a verified credential</div>
            <div className="cc-cert-brand">
              {'<Code>'}
              <span
                style={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg,#7B61FF,#FF6FD8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Her
              </span>
              {'</Way>'}
            </div>
          </div>
        </div>

        {nextTrack && (
          <div className="cc-next-track" aria-label={`Recommended next track: ${nextTrack.label}`}>
            <p className="cc-next-track-label">Recommended next</p>
            <button
              type="button"
              className="cc-next-track-btn"
              onClick={handleStartNextTrack}
              style={{ borderColor: nextTrack.accent }}
            >
              <span className="cc-next-track-icon" aria-hidden="true">{nextTrack.icon}</span>
              <span className="cc-next-track-text">
                <span className="cc-next-track-title">Start {nextTrack.label}</span>
                <span className="cc-next-track-sub">Builds on what you just shipped.</span>
              </span>
              <span className="cc-next-track-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        )}

        <div className="cc-actions">
          <button
            type="button"
            className="cc-download-btn"
            onClick={handleDownload}
            disabled={downloading}
            aria-busy={downloading}
          >
            {downloading ? 'Generating…' : 'Download Progress Summary (PDF)'}
          </button>

          <button type="button" className="cc-share-btn" onClick={async () => {
            const text = `I just completed the ${course.label} course on CodeHerWay! ${lessonCount} lessons done. #CodeHerWay #WomenInTech #LearnToCode`;
            // Each path silently swallows its own failure mode:
            //   - navigator.share rejects when the user cancels the sheet
            //   - clipboard.writeText can reject without a user gesture
            //     or when the document is not focused (notably in Safari)
            // We do NOT want either to bubble as an unhandled rejection.
            if (navigator.share) {
              try { await navigator.share({ title: 'CodeHerWay learner progress', text }); } catch { /* user cancelled */ }
              return;
            }
            if (navigator.clipboard) {
              try {
                await navigator.clipboard.writeText(text);
                toast.show('Copied progress update to clipboard.');
              } catch {
                toast.show('Could not copy. Try the Download button instead.');
              }
            }
          }}>
            Share progress
          </button>

          <button type="button" className="cc-close-btn" onClick={onClose}>
            Continue learning
          </button>
        </div>
      </div>
    </div>
  );
}

