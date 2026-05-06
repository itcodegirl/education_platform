import { useEffect, useRef, useState } from 'react';
import { generateCertificate } from '../../utils/certificate';
import { useToast } from '../shared/Toast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { COMPLETION_EXPORT_COPY, PROGRESS_SYNC_COPY } from '../../constants/progressCopy';

export function CourseComplete({ isOpen, onClose, course, displayName, lessonCount }) {
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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateCertificate({
        studentName: displayName || 'Learner',
        courseName: course.label,
        courseId: course.id,
        lessonCount,
        completionDate: today,
      });
    } catch {
      toast.show('Learner export failed — try again in a moment.');
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
            {PROGRESS_SYNC_COPY} {COMPLETION_EXPORT_COPY} This is learner progress, not a third-party certificate.
          </p>
        </div>

        <div className="cc-cert">
          <div className="cc-cert-inner">
            <div className="cc-cert-border" style={{ borderColor: course.accent }} />
            <div className="cc-cert-icon">{course.icon}</div>
            <div className="cc-cert-label">Learner export of completion</div>
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

        <div className="cc-actions">
          <button
            type="button"
            className="cc-download-btn"
            onClick={handleDownload}
            disabled={downloading}
            aria-busy={downloading}
          >
            {downloading ? 'Generating…' : 'Download learner export (PDF)'}
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

