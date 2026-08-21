/**
 * AssessmentAgent I/O types.
 */

import type { Question, StudentResponse } from "@/types/entities";

export type AssessmentInput = {
  classId: string;
  subjectId: string;
  topicId: string;
  /** Grade level — used in the Granite prompt for age-appropriate questions */
  grade: number;
  difficulty: "easy" | "medium" | "hard";
  /** Average mastery score for the class on this topic (0–100) */
  studentMasteryLevel: number;
  /** Number of questions to generate (MCQ + short answer combined) */
  questionCount: number;
  schoolId: string;
  /** Student IDs to grade — if provided, agent grades their responses too */
  studentIds?: string[];
  /** Pre-submitted student answers; keyed by studentId → questionId → answer */
  studentAnswers?: Record<string, Record<string, string>>;
  /** Language for generated content — "en" (default) or "gu" (Gujarati) */
  lang?: "en" | "gu";
  /** Question type split — "mcq" | "short_answer" | "mixed" (default mixed 60/40) */
  questionType?: "mcq" | "short_answer" | "mixed";
};

export type GradedStudentResponse = StudentResponse & {
  /** Breakdown per question: questionId → { awarded, max } */
  questionBreakdown: Record<string, { awarded: number; max: number }>;
};

export type AssessmentOutput = {
  assessmentId: string;
  questions: Question[];
  gradedResponses: GradedStudentResponse[];
  auditLog: AuditEntry[];
};

export type AuditEntry = {
  studentId: string;
  action: "graded" | "feedback_generated";
  timestamp: string;
  /** feedbackStatus at time of logging */
  feedbackStatus: "pending_review";
};
