// ═══════════════════════════════════════════════
// STUDENT STATS — Personal analytics dashboard
//
// Sections:
//   1. Overview cards (XP, level, streak, completion %)
//   2. Course breakdown (per-course progress bars)
//   3. Quiz accuracy (per-course scores + overall trend)
//   4. Learning velocity (lessons per week)
//   5. Strengths & weaknesses (best/worst quiz topics)
//   6. Activity & badges
// ═══════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import { COURSES } from '../../data';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';
import { BADGE_DEFS } from '../../context/ProgressContext';

export function StudentStats({ isOpen, onClose }) {
  const {
    progress, quizScores, xpTotal, streak,
    dailyCount, earnedBadges, srCards, bookmarks, notes,
  } = useProgress();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  // ─── Computed analytics ───────────────────────
  const stats = useMemo(() => {
    const completed = progress.completed || [];
    const level = getLevel(xpTotal);
    const xpInLevel = getXPInLevel(xpTotal);
    const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

    // Per-course progress
    const courseStats = COURSES.map(course => {
      const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
      const done = completed.filter(k => k.startsWith(course.label)).length;
      const pct = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;

      // Quiz scores for this course
      const courseQuizKeys = Object.keys(quizScores).filter(k => {
        const lessonId = k.replace('l:', '').replace('m:', '');
        return lessonId.startsWith(course.id.charAt(0));
      });
      const quizResults = courseQuizKeys.map(k => {
        const [got, total] = quizScores[k].split('/').map(Number);
        return { got, total, pct: total > 0 ? Math.round((got / total) * 100) : 0 };
      });
      const avgQuizPct = quizResults.length > 0
        ? Math.round(quizResults.reduce((s, q) => s + q.pct, 0) / quizResults.length)
        : null;

      return {
        id: course.id,
        label: course.label,
        icon: course.icon,
        accent: course.accent,
        totalLessons,
        done,
        pct,
        quizzesTaken: quizResults.length,
        avgQuizPct,
      };
    });

    // Overall quiz accuracy
    const allQuizKeys = Object.keys(quizScores);
    const allResults = allQuizKeys.map(k => {
      const [got, total] = quizScores[k].split('/').map(Number);
      return { key: k, got, total, pct: total > 0 ? Math.round((got / total) * 100) : 0 };
    });
    const overallQuizPct = allResults.length > 0
      ? Math.round(allResults.reduce((s, q) => s + q.pct, 0) / allResults.length)
      : null;

    // Best and worst quiz topics
    const sorted = [...allResults].sort((a, b) => a.pct - b.pct);
    const weakest = sorted.slice(0, 3).filter(q => q.pct < 80);
    const strongest = sorted.slice(-3).reverse().filter(q => q.pct >= 80);

    // Total progress
    const totalLessons = courseStats.reduce((s, c) => s + c.totalLessons, 0);
    const totalDone = completed.length;
    const totalPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

    // Badges
    const badgeCount = Object.keys(earnedBadges).length;
    const totalBadges = BADGE_DEFS.length;

    return {
      level, xpTotal, xpInLevel, xpPct,
      totalDone, totalLessons, totalPct,
      courseStats,
      overallQuizPct, quizzesTaken: allResults.length,
      strongest, weakest,
      streak, dailyCount,
      badgeCount, totalBadges,
      srDue: srCards.filter(c => c.nextReview <= Date.now()).length,
      srTotal: srCards.length,
      bookmarkCount: bookmarks.length,
      noteCount: Object.keys(notes).length,
    };
  }, [progress, quizScores, xpTotal, streak, dailyCount, earnedBadges, srCards, bookmarks, notes]);

  if (!isOpen) return null;

  // ─── Helpers ──────────────────────────────────
  const quizColor = (pct) => {
    if (pct >= 80) return '#10b981';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const findLessonTitle = (quizKey) => {
    const id = quizKey.replace('l:', '').replace('m:', '');
    for (const course of COURSES) {
      for (const mod of course.modules) {
        if (quizKey.startsWith('m:') && String(mod.id) === id) return `${mod.title} (Quiz)`;
        for (const les of mod.lessons) {
          if (les.id === id) return les.title;
        }
      }
    }
    return quizKey;
  };

  const exportProgressPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
      const W = 210;
      let y = 20;

      // Header
      doc.setFillColor(8, 8, 15);
      doc.rect(0, 0, W, 50, 'F');
      doc.setFontSize(20);
      doc.setTextColor(255, 107, 157);
      doc.setFont('courier', 'bold');
      doc.text('CodeHerWay', W / 2, 22, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(180, 180, 200);
      doc.setFont('helvetica', 'normal');
      doc.text(`Progress Report for ${displayName}`, W / 2, 32, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 160);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, W / 2, 40, { align: 'center' });
      y = 60;

      // Overview
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('Overview', 20, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Level: ${stats.level}  |  XP: ${stats.xpTotal.toLocaleString()}  |  Streak: ${stats.streak} days`, 20, y); y += 6;
      doc.text(`Lessons: ${stats.totalDone}/${stats.totalLessons} (${stats.totalPct}%)  |  Quizzes: ${stats.quizzesTaken}${stats.overallQuizPct !== null ? ` (avg ${stats.overallQuizPct}%)` : ''}`, 20, y); y += 6;
      doc.text(`Badges: ${stats.badgeCount}/${stats.totalBadges}  |  Bookmarks: ${stats.bookmarkCount}  |  Notes: ${stats.noteCount}`, 20, y); y += 14;

      // Course breakdown
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('Course Progress', 20, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      for (const c of stats.courseStats) {
        doc.setTextColor(60, 60, 60);
        const quizInfo = c.avgQuizPct !== null ? `  |  Quiz avg: ${c.avgQuizPct}%` : '';
        doc.text(`${c.label}: ${c.done}/${c.totalLessons} lessons (${c.pct}%)${quizInfo}`, 24, y);
        // Progress bar
        doc.setFillColor(230, 230, 230);
        doc.rect(24, y + 2, 120, 3, 'F');
        const [r, g, b] = c.accent.match(/\w{2}/g).map(h => parseInt(h, 16));
        doc.setFillColor(r || 200, g || 100, b || 150);
        doc.rect(24, y + 2, Math.max(1, 120 * c.pct / 100), 3, 'F');
        y += 10;
      }
      y += 6;

      // Badges earned
      const earned = BADGE_DEFS.filter(b => earnedBadges[b.id]);
      if (earned.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text('Badges Earned', 20, y); y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        for (const b of earned) {
          doc.text(`${b.name} — ${b.desc}`, 24, y); y += 6;
          if (y > 270) { doc.addPage(); y = 20; }
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 170);
      doc.text('codeherway.com — Where women code, lead, and rewrite the future of tech', W / 2, 290, { align: 'center' });

      doc.save(`CodeHerWay-Progress-${displayName.replace(/\s+/g, '-')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal ss-modal">
        <div className="ss-head">
          <h2 className="ss-title">📊 Your Progress</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="cpv-explain" onClick={exportProgressPDF} disabled={exporting}>
              {exporting ? '⏳ Generating...' : '📄 Download PDF'}
            </button>
            <button type="button" className="cheatsheet-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="ss-body">

          {/* ─── Overview Cards ─────────────────── */}
          <div className="ss-cards">
            <div className="ss-card">
              <span className="ss-card-value">{stats.level}</span>
              <span className="ss-card-label">Level</span>
              <div className="ss-mini-bar">
                <div className="ss-mini-fill" style={{ width: `${stats.xpPct}%` }} />
              </div>
              <span className="ss-card-sub">{stats.xpInLevel}/{XP_PER_LEVEL} XP to next</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.xpTotal.toLocaleString()}</span>
              <span className="ss-card-label">Total XP</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.streak}</span>
              <span className="ss-card-label">Day Streak</span>
              <span className="ss-card-sub">{stats.streak >= 7 ? '🔥 On fire!' : stats.streak >= 3 ? '💪 Building!' : '📅 Keep going!'}</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.totalPct}%</span>
              <span className="ss-card-label">Complete</span>
              <span className="ss-card-sub">{stats.totalDone}/{stats.totalLessons} lessons</span>
            </div>
          </div>

          {/* ─── Course Breakdown ──────────────── */}
          <div className="ss-section">
            <h3 className="ss-section-title">Course Progress</h3>
            <div className="ss-course-list">
              {stats.courseStats.map(c => (
                <div key={c.id} className="ss-course-row">
                  <div className="ss-course-info">
                    <span className="ss-course-icon">{c.icon}</span>
                    <span className="ss-course-name">{c.label}</span>
                    <span className="ss-course-count">{c.done}/{c.totalLessons}</span>
                  </div>
                  <div className="ss-progress-bar">
                    <div className="ss-progress-fill" style={{ width: `${c.pct}%`, background: c.accent }} />
                  </div>
                  <div className="ss-course-meta">
                    <span className="ss-course-pct">{c.pct}%</span>
                    {c.avgQuizPct !== null && (
                      <span className="ss-quiz-badge" style={{ color: quizColor(c.avgQuizPct) }}>
                        Quiz avg: {c.avgQuizPct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Quiz Accuracy ─────────────────── */}
          {stats.quizzesTaken > 0 && (
            <div className="ss-section">
              <h3 className="ss-section-title">Quiz Accuracy</h3>
              <div className="ss-quiz-overview">
                <div className="ss-quiz-donut">
                  <svg viewBox="0 0 36 36" className="ss-donut-svg">
                    <path className="ss-donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="ss-donut-fill" strokeDasharray={`${stats.overallQuizPct}, 100`}
                      style={{ stroke: quizColor(stats.overallQuizPct) }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="ss-donut-label">{stats.overallQuizPct}%</span>
                </div>
                <div className="ss-quiz-detail">
                  <p className="ss-quiz-total">{stats.quizzesTaken} quizzes completed</p>
                  {stats.srTotal > 0 && (
                    <p className="ss-quiz-sr">🔄 {stats.srDue} cards due for review ({stats.srTotal} total)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Strengths & Weaknesses ────────── */}
          {(stats.strongest.length > 0 || stats.weakest.length > 0) && (
            <div className="ss-section">
              <h3 className="ss-section-title">Strengths & Areas to Review</h3>
              <div className="ss-strength-grid">
                {stats.strongest.length > 0 && (
                  <div className="ss-strength-col">
                    <span className="ss-col-label ss-strong">💪 Strongest</span>
                    {stats.strongest.map(q => (
                      <div key={q.key} className="ss-topic-item ss-topic-strong">
                        <span className="ss-topic-score" style={{ color: quizColor(q.pct) }}>{q.pct}%</span>
                        <span className="ss-topic-name">{findLessonTitle(q.key)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.weakest.length > 0 && (
                  <div className="ss-strength-col">
                    <span className="ss-col-label ss-weak">📚 Needs Review</span>
                    {stats.weakest.map(q => (
                      <div key={q.key} className="ss-topic-item ss-topic-weak">
                        <span className="ss-topic-score" style={{ color: quizColor(q.pct) }}>{q.pct}%</span>
                        <span className="ss-topic-name">{findLessonTitle(q.key)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Activity Summary ──────────────── */}
          <div className="ss-section">
            <h3 className="ss-section-title">Activity</h3>
            <div className="ss-activity-grid">
              <div className="ss-activity-item">
                <span className="ss-activity-icon">🏆</span>
                <span className="ss-activity-value">{stats.badgeCount}/{stats.totalBadges}</span>
                <span className="ss-activity-label">Badges earned</span>
              </div>
              <div className="ss-activity-item">
                <span className="ss-activity-icon">★</span>
                <span className="ss-activity-value">{stats.bookmarkCount}</span>
                <span className="ss-activity-label">Bookmarks</span>
              </div>
              <div className="ss-activity-item">
                <span className="ss-activity-icon">✏️</span>
                <span className="ss-activity-value">{stats.noteCount}</span>
                <span className="ss-activity-label">Notes</span>
              </div>
              <div className="ss-activity-item">
                <span className="ss-activity-icon">🔄</span>
                <span className="ss-activity-value">{stats.srTotal}</span>
                <span className="ss-activity-label">Review cards</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
