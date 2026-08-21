/**
 * feedback.ts — per-student qualitative feedback generation via Granite LLM.
 *
 * Generated feedback is always stored with feedbackStatus: "pending_review".
 * It becomes visible to students only after a teacher approves it via
 * PATCH /api/assessments/:id/approve (audit trail requirement).
 *
 * Prompt design: encouraging, specific, 3-sentence, simple English.
 * ASSUMPTION: English is used for feedback across all subjects. The teacher
 * may translate to Gujarati before approving if needed — that step is manual.
 */

import { generateText } from "@/lib/ibm/watsonx";
import type { Question } from "@/types/entities";
import type { GradedAnswer } from "./grader";

export type FeedbackInput = {
  studentId: string;
  topicId: string;
  subjectId: string;
  grade: number;
  /** Student's average mastery score on this topic (0–100) */
  masteryLevel: number;
  questions: Question[];
  answers: Record<string, string>;    // questionId → answer
  gradedBreakdown: GradedAnswer[];
  totalScore: number;
  maxScore: number;
  /** Language for generated feedback — "en" (default) or "gu" (Gujarati) */
  lang?: "en" | "gu";
};

export type FeedbackResult = {
  studentId: string;
  feedbackText: string;
  feedbackStatus: "pending_review";
};

/**
 * Generate personalised, encouraging feedback for a student.
 * Always returns feedbackStatus: "pending_review" — never "approved".
 */
export async function generateFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const { studentId, topicId, subjectId, grade, masteryLevel, totalScore, maxScore } = input;
  const scorePercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Identify questions the student got wrong for targeted feedback
  const wrongQIds = input.gradedBreakdown
    .filter((b) => b.awarded < b.max)
    .map((b) => b.questionId);
  const wrongQuestions = input.questions
    .filter((q) => wrongQIds.includes(q.id))
    .map((q) => q.text)
    .slice(0, 3); // cap at 3 to keep prompt short

  const masteryLabel =
    masteryLevel < 40 ? "beginner" : masteryLevel < 70 ? "developing" : "proficient";

  const langInstruction =
    (input.lang ?? "en") === "gu"
      ? "IMPORTANT: Write the feedback in Gujarati (ગુજરાતી) script. Do NOT use English."
      : "Write the feedback in English.";

  const prompt = `You are a kind and encouraging teacher writing feedback for a Grade ${grade} student in rural India.
Subject: ${subjectId}, Topic: ${input.topicId}
Student score: ${totalScore}/${maxScore} (${scorePercent}%)
Student's current mastery level on this topic: ${masteryLabel} (${masteryLevel}/100)
${wrongQuestions.length > 0 ? `Areas to improve: ${wrongQuestions.join("; ")}` : "The student answered all questions correctly."}
Language instruction: ${langInstruction}

Write exactly 3 sentences of personalised feedback:
1. Acknowledge what the student did well or their effort.
2. Give one specific, actionable tip to improve on their weak area.
3. End with an encouraging statement about their progress.

${langInstruction} Do not use complex vocabulary. Be warm and supportive.`;

  let feedbackText: string;
  try {
    feedbackText = await generateText({ prompt, maxNewTokens: 200, temperature: 0.7 });
    // Trim to 3 sentences if Granite generates more
    feedbackText = feedbackText
      .split(/(?<=[.!?])\s+/)
      .slice(0, 3)
      .join(" ")
      .trim();
  } catch {
    // Fallback feedback if LLM call fails
    feedbackText = `You scored ${scorePercent}% on ${topicId}. Keep practising — every effort counts! Ask your teacher if you need help with any questions.`;
  }

  return {
    studentId,
    feedbackText,
    feedbackStatus: "pending_review",
  };
}
