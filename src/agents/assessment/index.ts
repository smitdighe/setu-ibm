/**
 * AssessmentAgent — orchestrates question generation, grading, and feedback.
 *
 * Flow:
 *   1. generateQuestions()  — Granite LLM → validated Question[]
 *   2. (if studentAnswers provided) gradeStudentAnswers() per student
 *   3. generateFeedback() per student  — stored as "pending_review"
 *   4. saveStudentResponses() → Cloudant
 *   5. Return AssessmentOutput
 *
 * The orchestrator fires the post-assessment trigger after this returns,
 * which calls AnalyticsAgent to recompute risk scores (fire-and-forget).
 */

import type { BobAgent, AgentTool } from "@/types/agents";
import type { AssessmentInput, AssessmentOutput, GradedStudentResponse, AuditEntry } from "./types";
import { generateQuestions } from "./generator";
import { gradeStudentAnswers } from "./grader";
import { generateFeedback } from "./feedback";
import { createAssessment, saveStudentResponses } from "@/lib/db/assessment";
import { getStudentById } from "@/lib/db/student";
import type { StudentResponse } from "@/types/entities";

export class AssessmentAgent implements BobAgent<AssessmentInput, AssessmentOutput> {
  readonly name = "assessment";
  readonly description =
    "Generates quizzes via Granite LLM, auto-grades responses, and produces per-student feedback stored as pending_review.";
  readonly tools: AgentTool[] = [];

  async run(input: AssessmentInput): Promise<AssessmentOutput> {
    const {
      classId, subjectId, topicId, grade, difficulty,
      studentMasteryLevel, questionCount,
      schoolId, studentIds = [], studentAnswers = {}, lang, questionType,
    } = input;

    // ── Step 1: Generate questions ────────────────────────────────────────────
    const questions = await generateQuestions({
      topicId,
      subjectId,
      grade,
      difficulty,
      questionCount,
      lang,
      questionType,
    });

    // ── Step 2: Persist the Assessment document (draft) ───────────────────────
    const now = new Date().toISOString();
    const assessment = await createAssessment({
      type: "assessment",
      schoolId,
      classId,
      subjectId,
      topicId,
      difficulty,
      questions,
      studentResponses: [],
      status: studentIds.length > 0 ? "active" : "draft",
      createdAt: now,
      updatedAt: now,
    });
    const assessmentId = assessment._id!;

    if (studentIds.length === 0) {
      // No answers submitted yet — return draft with questions only
      return { assessmentId, questions, gradedResponses: [], auditLog: [] };
    }

    // ── Step 3: Grade each student's answers ──────────────────────────────────
    const gradedResponses: GradedStudentResponse[] = [];
    const auditLog: AuditEntry[] = [];

    await Promise.all(
      studentIds.map(async (studentId) => {
        const answers = studentAnswers[studentId] ?? {};
        const { breakdown, totalScore, maxScore } = await gradeStudentAnswers(questions, answers);

        // Get student mastery for feedback context
        const student = await getStudentById(studentId);
        const topicMastery =
          student?.subjectMastery?.[subjectId]?.[topicId] ?? studentMasteryLevel;

        // ── Step 4: Generate feedback ─────────────────────────────────────────
        const feedbackResult = await generateFeedback({
          studentId,
          topicId,
          subjectId,
          grade,
          masteryLevel: topicMastery,
          questions,
          answers,
          gradedBreakdown: breakdown,
          totalScore,
          maxScore,
          lang,
        });

        const gradedAt = new Date().toISOString();

        const response: StudentResponse = {
          studentId,
          answers,
          score: totalScore,
          maxScore,
          feedbackText: feedbackResult.feedbackText,
          feedbackStatus: "pending_review",
          gradedAt,
        };

        const gradedResponse: GradedStudentResponse = {
          ...response,
          questionBreakdown: Object.fromEntries(
            breakdown.map((b) => [b.questionId, { awarded: b.awarded, max: b.max }])
          ),
        };

        gradedResponses.push(gradedResponse);
        auditLog.push(
          { studentId, action: "graded", timestamp: gradedAt, feedbackStatus: "pending_review" },
          { studentId, action: "feedback_generated", timestamp: gradedAt, feedbackStatus: "pending_review" }
        );
      })
    );

    // ── Step 5: Persist all student responses to Cloudant ─────────────────────
    const responsesToSave: StudentResponse[] = gradedResponses.map(
      ({ questionBreakdown: _qb, ...rest }) => rest
    );
    await saveStudentResponses(assessmentId, responsesToSave);

    return { assessmentId, questions, gradedResponses, auditLog };
  }
}

export const assessmentAgent = new AssessmentAgent();
