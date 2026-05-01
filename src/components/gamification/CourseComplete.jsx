// ═══════════════════════════════════════════════
// COURSE COMPLETE — Celebration + downloadable certificate
// ═══════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { generateCertificate } from '../../utils/certificate';
import { useToast } from '../shared/Toast';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function CourseComplete({ isOpen, onClose, course, displayName, lessonCount }) {
  const [show, setShow] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const DOWNLOAD_FEEDBACK_MS = 1000;

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
      toast.show('Certificate failed — try again in a moment.');
    } finally {
      setTimeout(() => setDownloading(false), DOWNLOAD_FEEDBACK_MS);
    }
  };

  return (
    <div className="cc-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`cc-card ${show ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${course.label} course complete`}
        tabIndex={-1}
      >
        <div className="cc-badge-row">
          <span className="cc-trophy">🏆</span>
        </div>

        <div className="cc-header">
          <h2 className="cc-title">Course Complete!</h2>
          <p className="cc-sub">You crushed it.</p>
        </div>

        <div className="cc-cert">
          <div className="cc-cert-inner">
            <div className="cc-cert-border" style={{ borderColor: course.accent }} />
            <div className="cc-cert-icon">{course.icon}</div>
            <div className="cc-cert-label">Certificate of Completion</div>
            <div className="cc-cert-course" style={{ color: course.accent }}>
              {course.label}
            </div>
            <div className="cc-cert-name">{displayName || 'Learner'}</div>
            <div className="cc-cert-detail">
              Completed all {lessonCount} lessons
            </div>
            <div className="cc-cert-date">{today}</div>
            <div className="cc-cert-brand">&lt;Code&gt;<span style={{fontWeight:700,background:'linear-gradient(135deg,#7B61FF,#FF6FD8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Her</span>&lt;/Way&gt;</div>
          </div>
        </div>

        <div className="cc-actions">
          <button type="button"
            className="cc-download-btn"
            onClick={handleDownload}
            disabled={downloading}
            aria-busy={downloading}
          >
            {downloading ? '⏳ Generating...' : '📄 Download Certificate (PDF)'}
          </button>

          <button type="button" className="cc-share-btn" onClick={async () => {
            const text = `I just completed the ${course.label} course on CodeHerWay! 🎉 ${lessonCount} lessons done. #CodeHerWay #WomenInTech #LearnToCode`;
            if (navigator.share) {
              try { await navigator.share({ title: 'CodeHerWay Certificate', text }); } catch { /* user cancelled */ }
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(text);
              toast.show('Copied to clipboard!');
            }
          }}>
            📤 Share Achievement
          </button>

          <button type="button" className="cc-close-btn" onClick={onClose}>
            Keep Going →
          </button>
        </div>
      </div>
    </div>
  );
}
