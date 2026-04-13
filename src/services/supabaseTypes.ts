// ═══════════════════════════════════════════════
// Supabase row / DTO types
//
// Kept intentionally narrow — just enough shape for
// the services in this folder. The full Database
// type could be generated via `supabase gen types`,
// but for a portfolio repo these hand-written types
// document the contract without adding a codegen
// step.
// ═══════════════════════════════════════════════

export type UUID = string;

export interface Profile {
  id: UUID;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_disabled: boolean;
}

export interface AuthUser {
  id: UUID;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface ProgressRow {
  id: UUID;
  user_id: UUID;
  lesson_key: string;
  completed_at: string;
}

export interface QuizScoreRow {
  id: UUID;
  user_id: UUID;
  quiz_key: string;
  score: string;
  completed_at: string;
}

export interface XPRow {
  user_id: UUID;
  total: number;
  updated_at: string;
}

export interface StreakRow {
  user_id: UUID;
  days: number;
  last_date: string | null;
  updated_at: string;
}

export interface BadgeRow {
  id: UUID;
  user_id: UUID;
  badge_id: string;
  earned_at: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
}

// ─── Gamification ──────────────────────────────

export interface BadgeEligibilityContext {
  completedCount: number;
  quizCount: number;
  streak: number;
  xp: number;
  coursesVisited: number;
  bookmarkCount: number;
  dailyCount: number;
  srCount: number;
  noteCount: number;
}

export type BadgeEligibility = Record<string, boolean>;

// ─── Learning engine ───────────────────────────

export interface LearningEngineDeps {
  toggleLesson: (lessonKey: string) => void;
  saveQuizScore: (quizKey: string, score: string) => void;
  awardXP: (amount: number, reason?: string) => void;
  recordDailyActivity: () => void;
  completedSet: Set<string>;
}

export interface QuizSubmitResult {
  score: number;
  total: number;
  pct: number;
}

export interface ChallengeResult {
  challengeId: string;
  completed: true;
}

// ─── AI proxy ──────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICallPayload {
  system?: string;
  messages?: AIMessage[];
  maxTokens?: number;
}
