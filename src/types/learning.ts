// Learning-domain types only.
//
// This file describes the product model for course content,
// quizzes, badges, and spaced repetition. Persistence-layer
// types stay in src/services/supabaseTypes.ts so we keep the
// learning model separate from database row shapes.

export type BuiltInCourseId = 'html' | 'css' | 'js' | 'react' | 'python';
export type CourseId = BuiltInCourseId | (string & {});

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CourseMetadata {
  id: CourseId;
  label: string;
  icon: string;
  accent: string;
}

export interface Course<TModule = LearningModule> extends CourseMetadata {
  modules: TModule[];
}

export interface LearningModule<TLesson = Lesson> {
  id: number | string;
  title: string;
  emoji: string;
  tagline: string;
  difficulty?: DifficultyLevel;
  lessons: TLesson[];
}

export interface LessonMetadata {
  estimatedTime?: number;
  difficulty?: DifficultyLevel;
  conceptsCount?: number;
  tasksCount?: number;
}

export interface LearningConcept {
  name: string;
  definition: string;
  analogy?: string;
}

export interface HookSection {
  accomplishments: string[];
}

export interface DoSection {
  title: string;
  steps: string[];
  code?: string;
  result?: string;
  proofRequired?: string;
}

export interface UnderstandSection {
  concepts: LearningConcept[];
  keyTakeaway?: string;
}

export interface BuildSection {
  goal: string;
  codeComparison?: {
    old: string;
    new: string;
  };
  hint?: string;
}

export interface ChallengeSection {
  title?: string;
  mission: string;
  requirements?: string[];
  starterCode?: string;
  bonusChallenge?: string;
}

export interface SummarySection {
  capabilities: string[];
}

export interface BridgeSection {
  preview: string;
  nextLessonId?: string;
}

// Legacy lessons are still present in parts of the codebase and use
// a simpler "content + code + tip + challenge" shape.
export interface LegacyLesson {
  id: string;
  title: string;
  content: string;
  code: string;
  challenge?: string;
  tip?: string;
}

// Structured lessons are the richer curriculum format used by the
// newer course content in education_platform.
export interface StructuredLesson {
  id: string;
  title: string;
  prereqs?: string[];
  difficulty?: DifficultyLevel;
  duration?: string;
  metadata?: LessonMetadata;
  hook?: HookSection;
  do?: DoSection;
  understand?: UnderstandSection;
  build?: BuildSection;
  challenge?: ChallengeSection;
  summary?: SummarySection;
  bridge?: BridgeSection;

  // Some authored modules still use a flatter structured format.
  concepts?: string[];
  tasks?: string[];
  output?: string;
  code: string;
  devFession?: string;
}

export type Lesson = LegacyLesson | StructuredLesson;

export type QuizQuestionType = 'mc' | 'code';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  code?: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Quiz {
  lessonId?: string;
  moduleId?: number | string;
  questions: QuizQuestion[];
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  emoji?: string;
}

export interface SpacedRepetitionCard {
  question: string;
  code?: string;
  options: string[];
  correct: number;
  explanation: string;
  source: string;
  added: number;
  nextReview: number;
  interval: number;
  ease: number;
}

export interface CheatSheetSection {
  title: string;
  items: Array<[string, string]>;
}

export interface ProjectDefinition {
  title: string;
  diff: DifficultyLevel;
  desc: string;
  skills: string[];
}

export interface GlossaryTerm {
  term: string;
  def: string;
  course: CourseId;
}
