// ═══════════════════════════════════════════════
// ADMIN DASHBOARD — User stats, progress, analytics
// Protected by is_admin flag in profiles table.
//
// This file owns access-checking, data loading, and
// tab routing. The tab bodies themselves live under
// ./tabs/ so each screen can evolve independently.
// ═══════════════════════════════════════════════

import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../providers';
import {
  computeAdminStats,
  computeCourseStats,
  computeTopUsers,
  computeQuizStats,
} from './adminStats';
import { OverviewTab } from './tabs/OverviewTab';
import { UsersTab } from './tabs/UsersTab';
import { CoursesTab } from './tabs/CoursesTab';
import { QuizzesTab } from './tabs/QuizzesTab';
import { AuditLogTab } from './tabs/AuditLogTab';

const LessonBuilder = lazy(() => import('./LessonBuilder').then(m => ({ default: m.LessonBuilder })));

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'users', label: '👥 Users' },
  { id: 'courses', label: '📚 Courses' },
  { id: 'quizzes', label: '📝 Quizzes' },
  { id: 'audit', label: '🗒️ Audit Log' },
  { id: 'builder', label: '🛠️ Lesson Builder' },
];

export function AdminDashboard({ onClose }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(null);
  const [data, setData] = useState({
    users: [],
    progress: [],
    quizScores: [],
    xp: [],
    streaks: [],
    badges: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (!user) { setChecking(false); return; }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        setIsAdmin(!!profile?.is_admin);
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }
    checkAdmin();
  }, [user]);

  // Fetch all data once admin is confirmed
  useEffect(() => {
    if (!isAdmin) return;
    async function fetchAll() {
      setLoading(true);
      setLoadError(null);
      try {
        const [users, progress, quizScores, xp, streaks, badges] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('progress').select('*'),
          supabase.from('quiz_scores').select('*'),
          supabase.from('xp').select('*'),
          supabase.from('streaks').select('*'),
          supabase.from('badges').select('*'),
        ]);
        setData({
          users: users.data || [],
          progress: progress.data || [],
          quizScores: quizScores.data || [],
          xp: xp.data || [],
          streaks: streaks.data || [],
          badges: badges.data || [],
        });
      } catch (err) {
        setLoadError('Failed to load admin data. Check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [isAdmin]);

  // ─── Access denied states ──────────────────
  if (checking) return (
    <div className="admin-wrap">
      <div className="admin-loading">Checking access...</div>
    </div>
  );

  if (!isAdmin) return (
    <div className="admin-wrap">
      <div className="admin-denied">
        <span className="admin-denied-icon">🔒</span>
        <h2>Access Denied</h2>
        <p>You don't have admin privileges.</p>
        <button className="admin-back-btn" onClick={onClose}>← Back to Platform</button>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="admin-wrap">
      <div className="admin-denied">
        <span className="admin-denied-icon">📡</span>
        <h2>Connection Error</h2>
        <p>{loadError}</p>
        <button className="admin-back-btn" onClick={() => window.location.reload()}>↺ Retry</button>
      </div>
    </div>
  );

  // ─── Derived stats ────────────────────────
  const stats = computeAdminStats(data);
  const courseStats = computeCourseStats(data);
  const topUsers = computeTopUsers(data);
  const quizStats = computeQuizStats(data);

  const handleUserUpdated = (userId, patch) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(usr => (usr.id === userId ? { ...usr, ...patch } : usr)),
    }));
  };

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <span className="admin-logo">⚡</span>
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">CodeHerWay Platform Analytics</p>
            </div>
          </div>
          <button className="admin-back-btn" onClick={onClose}>← Back to Platform</button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">Loading data...</div>
        ) : (
          <div className="admin-content">
            {tab === 'overview' && (
              <OverviewTab
                data={data}
                stats={stats}
                courseStats={courseStats}
                topUsers={topUsers}
              />
            )}

            {tab === 'users' && (
              <UsersTab
                data={data}
                currentUserId={user.id}
                currentAdminName={data.users.find(u => u.id === user.id)?.display_name || null}
                totalUsers={stats.totalUsers}
                actionLoading={actionLoading}
                setActionLoading={setActionLoading}
                onUserUpdated={handleUserUpdated}
              />
            )}

            {tab === 'courses' && (
              <CoursesTab courseStats={courseStats} progressRows={data.progress} />
            )}

            {tab === 'quizzes' && (
              <QuizzesTab quizStats={quizStats} />
            )}

            {tab === 'audit' && (
              <AuditLogTab />
            )}

            {tab === 'builder' && (
              <Suspense fallback={<div className="admin-loading">Loading builder...</div>}>
                <LessonBuilder
                  currentAdminId={user.id}
                  currentAdminName={data.users.find(u => u.id === user.id)?.display_name || null}
                />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
