/**
 * Core data model entities for the Setu platform.
 * All entities carry schoolId for multi-tenant scoping.
 * Cloudant document _id and _rev are optional (absent before first save).
 */

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Base Cloudant document fields */
export type CloudantDoc = {
  _id?: string;
  _rev?: string;
};

export type Difficulty = "easy" | "medium" | "hard";
export type LearningPace = "slow" | "average" | "fast";
export type FeedbackStatus = "pending_review" | "approved" | "rejected";

// ─── Curriculum ───────────────────────────────────────────────────────────────

/** Static curriculum map loaded from src/data/curriculum.ts */
export type CurriculumMap = {
  /** subjectId → ordered list of topicIds (prerequisite order) */
  [subjectId: string]: string[];
};

// ─── Student ──────────────────────────────────────────────────────────────────

/**
 * subjectMastery: { [subjectId]: { [topicId]: 0–100 mastery score } }
 * Updated by AnalyticsAgent after each assessment cycle.
 */
export type SubjectMastery = Record<string, Record<string, number>>;

export type Student = CloudantDoc & {
  type: "student";
  schoolId: string;
  name: string;
  email: string;
  passwordHash: string;         // bcrypt hash — stored alongside doc for auth
  classId: string;
  subjectMastery: SubjectMastery;
  learningPace: LearningPace;
  riskFlag: boolean;
  riskScore: number;            // 0–1 composite risk score from AnalyticsAgent
  createdAt: string;            // ISO 8601
};

// ─── Teacher ──────────────────────────────────────────────────────────────────

export type Teacher = CloudantDoc & {
  type: "teacher";
  schoolId: string;
  name: string;
  email: string;
  passwordHash: string;
  assignedClassIds: string[];
  assignedSubjectIds: string[];
  createdAt: string;
};

// ─── School Admin ─────────────────────────────────────────────────────────────

export type Admin = CloudantDoc & {
  type: "admin";
  schoolId: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

// ─── Class ────────────────────────────────────────────────────────────────────

export type SkillDistribution = {
  remedial: number;    // count of students with mastery 0–60
  onTrack: number;     // count of students with mastery 61–80
  advanced: number;    // count of students with mastery 81–100
};

export type Class = CloudantDoc & {
  type: "class";
  schoolId: string;
  grade: number;
  section: string;         // e.g. "A", "B"
  subjectId: string;
  subjectName: string;
  studentIds: string[];
  teacherId: string;
  skillDistribution: SkillDistribution;
  updatedAt: string;
};

// ─── Assessment ───────────────────────────────────────────────────────────────

export type QuestionType = "mcq" | "short_answer";

export type MCQOption = {
  id: string;           // "a" | "b" | "c" | "d"
  text: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  options?: MCQOption[];   // only for MCQ
  correctAnswer: string;   // option id for MCQ, expected answer text for short_answer
  marks: number;
};

export type StudentResponse = {
  studentId: string;
  answers: Record<string, string>;   // questionId → answer
  score: number;                     // total score out of total marks
  maxScore: number;
  feedbackText: string;              // Granite-generated qualitative feedback
  feedbackStatus: FeedbackStatus;    // audit trail — pending until teacher approves
  gradedAt: string;
};

export type Assessment = CloudantDoc & {
  type: "assessment";
  schoolId: string;
  classId: string;
  subjectId: string;
  topicId: string;
  difficulty: Difficulty;
  questions: Question[];
  studentResponses: StudentResponse[];
  status: "draft" | "active" | "graded";
  createdAt: string;
  updatedAt: string;
};

// ─── Lesson Plan ──────────────────────────────────────────────────────────────

export type ContentLevel = "remedial" | "on_track" | "advanced";

export type ContentBlock = {
  level: ContentLevel;
  title: string;
  explanation: string;
  activity: string;
  worksheet: string;           // printable worksheet text
  estimatedMinutes: number;
};

export type LessonPlan = CloudantDoc & {
  type: "lessonPlan";
  schoolId: string;
  classId: string;
  subjectId: string;
  topicId: string;
  weekOf: string;              // ISO date string for the Monday of the week
  curriculumStandard: string;  // e.g. "NCERT Grade 6 Chapter 2"
  contentBlocks: ContentBlock[];
  cosKey: string;              // COS object key for the serialised document
  printableHtml: string;       // HTML string for browser print / PDF export
  status: "draft" | "published";
  createdAt: string;
};

// ─── Resource ─────────────────────────────────────────────────────────────────

export type ResourceSource = "skillsbuild" | "oer";

export type Resource = CloudantDoc & {
  type: "resource";
  schoolId: string;
  source: ResourceSource;
  subjectId: string;
  topicId: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  url: string;
  cachedAt: string;        // ISO 8601 — used for 24h TTL cache eviction
};

// ─── Ranked Resource (used by RecommendationAgent output) ────────────────────

export type RankedResource = Resource & {
  score: number;    // 0–1 relevance score
  reason: string;   // human-readable reason for the ranking
};
