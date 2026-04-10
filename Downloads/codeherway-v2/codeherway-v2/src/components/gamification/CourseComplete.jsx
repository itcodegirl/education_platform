// ═══════════════════════════════════════════════
// COURSE COMPLETE — Celebration + downloadable certificate
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { generateCertificate } from '../../utils/certificate';

const NEXT_COURSE = { html: 'css', css: 'js', js: 'react', react: null };
const COURSE_NAMES = { css: 'CSS', js: 'JavaScript', react: 'React' };
const COURSE_ICONS = { css: '🎨', js: '⚡', react: '⚛️' };

export function CourseComplete({ isOpen, onClose, course, displayName, lessonCount }) {
  const [show, setShow] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const DOWNLOAD_FEEDBACK_MS = 1000;

  const handleDownload = () => {
    setDownloading(true);
    try {
      generateCertificate({
        studentName: displayName || 'Learner',
        courseName: course.label,
        courseId: course.id,
        lessonCount,
        completionDate: today,
      });
    } catch {
      // Certificate generation is non-critical
    } finally {
      setTimeout(() => setDownloading(false), DOWNLOAD_FEEDBACK_MS);
    }
  };

  return (
    <div className="cc-overlay" onClick={onClose}>
      <div className={`cc-card ${show ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
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
            <div className="cc-cert-brand">⚡ CodeHerWay</div>
          </div>
        </div>

        <div className="cc-actions">
          <button
            className="cc-download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '⏳ Generating...' : '📄 Download Certificate (PDF)'}
          </button>

          <button className="cc-share-btn" onClick={() => {
            const text = `I just completed the ${course.label} course on CodeHerWay! 🎉 ${lessonCount} lessons done. #CodeHerWay #WomenInTech #LearnToCode`;
            if (navigator.share) {
              navigator.share({ title: 'CodeHerWay Certificate', text });
            } else {
              navigator.clipboard.writeText(text);
              alert('Copied to clipboard!');
            }
          }}>
            📤 Share Achievement
          </button>

          <button className="cc-close-btn" onClick={onClose}>
            Keep Going →
          </button>
        </div>

        {NEXT_COURSE[course.id] && (
          <div className="next-preview" style={{ margin: '16px 0 0', cursor: 'default' }}>
            <span className="next-preview-label">Recommended next</span>
            <span style={{ fontSize: 20 }}>{COURSE_ICONS[NEXT_COURSE[course.id]]}</span>
            <span className="next-preview-title">{COURSE_NAMES[NEXT_COURSE[course.id]]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
