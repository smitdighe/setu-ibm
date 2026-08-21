/**
 * Zod schemas for all Setu entities.
 * Used to validate LLM-generated JSON before saving to Cloudant
 * and to validate API request bodies.
 */

import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export const LearningPaceSchema = z.enum(["slow", "average", "fast"]);
export const FeedbackStatusSchema = z.enum(["pending_review", "approved", "rejected"]);
export const ContentLevelSchema = z.enum(["remedial", "on_track", "advanced"]);

// ─── Student ──────────────────────────────────────────────────────────────────

export const StudentSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("student"),
  schoolId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string(),
  classId: z.string().min(1),
  subjectMastery: z.record(z.string(), z.record(z.string(), z.number().min(0).max(100))),
  learningPace: LearningPaceSchema,
  riskFlag: z.boolean(),
  riskScore: z.number().min(0).max(1),
  createdAt: z.string().datetime({ offset: true }).or(z.string()),
});

// ─── Teacher ──────────────────────────────────────────────────────────────────

export const TeacherSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("teacher"),
  schoolId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string(),
  assignedClassIds: z.array(z.string()),
  assignedSubjectIds: z.array(z.string()),
  createdAt: z.string(),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const AdminSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("admin"),
  schoolId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.string(),
});

// ─── Class ────────────────────────────────────────────────────────────────────

export const SkillDistributionSchema = z.object({
  remedial: z.number().int().min(0),
  onTrack: z.number().int().min(0),
  advanced: z.number().int().min(0),
});

export const ClassSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("class"),
  schoolId: z.string().min(1),
  grade: z.number().int().min(1).max(12),
  section: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  studentIds: z.array(z.string()),
  teacherId: z.string().min(1),
  skillDistribution: SkillDistributionSchema,
  updatedAt: z.string(),
});

// ─── Assessment ───────────────────────────────────────────────────────────────

export const MCQOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "short_answer"]),
  text: z.string().min(1),
  options: z.array(MCQOptionSchema).optional(),
  correctAnswer: z.string(),
  marks: z.number().int().min(1),
});

export const StudentResponseSchema = z.object({
  studentId: z.string(),
  answers: z.record(z.string(), z.string()),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  feedbackText: z.string(),
  feedbackStatus: FeedbackStatusSchema,
  gradedAt: z.string(),
});

export const AssessmentSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("assessment"),
  schoolId: z.string().min(1),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  difficulty: DifficultySchema,
  questions: z.array(QuestionSchema).min(1),
  studentResponses: z.array(StudentResponseSchema),
  status: z.enum(["draft", "active", "graded"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Lesson Plan ──────────────────────────────────────────────────────────────

export const ContentBlockSchema = z.object({
  level: ContentLevelSchema,
  title: z.string().min(1),
  explanation: z.string().min(1),
  activity: z.string().min(1),
  worksheet: z.string().min(1),
  estimatedMinutes: z.number().int().min(1),
});

export const LessonPlanSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("lessonPlan"),
  schoolId: z.string().min(1),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  weekOf: z.string().min(1),
  curriculumStandard: z.string().min(1),
  contentBlocks: z.array(ContentBlockSchema).min(1),
  cosKey: z.string(),
  printableHtml: z.string(),
  status: z.enum(["draft", "published"]),
  createdAt: z.string(),
});

// ─── Resource ─────────────────────────────────────────────────────────────────

export const ResourceSchema = z.object({
  _id: z.string().optional(),
  _rev: z.string().optional(),
  type: z.literal("resource"),
  schoolId: z.string().min(1),
  source: z.enum(["skillsbuild", "oer"]),
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  difficulty: DifficultySchema,
  title: z.string().min(1),
  description: z.string(),
  url: z.string().url(),
  cachedAt: z.string(),
});

// ─── LLM-generated question list (used by AssessmentAgent) ───────────────────

export const GeneratedQuestionsSchema = z.object({
  questions: z.array(QuestionSchema),
});

// ─── LLM-generated content blocks (used by LessonPlanAgent) ──────────────────

export const GeneratedContentBlocksSchema = z.object({
  contentBlocks: z.array(ContentBlockSchema),
});
