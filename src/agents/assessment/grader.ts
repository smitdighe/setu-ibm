/**
 * grader.ts — auto-grading for MCQ and short-answer questions.
 *
 * MCQ:   exact match on correctAnswer (option id). Binary: full marks or 0.
 * Short: Granite LLM scores 0–(question.marks) with a brief justification.
 *        Normalised to the question's marks value.
 *
 * ASSUMPTION: Partial credit is not given for MCQ (standard for Gujarat board exams).
 */

import { generateJSON } from "@/lib/ibm/watsonx";
import { z } from "zod";
import type { Question } from "@/types/entities";

export type AnswerMap = Record<string, string>; // questionId → student's answer

export type GradedAnswer = {
  questionId: string;
  awarded: number;
  max: number;
  justification?: string; // only for short-answer LLM grading
};

/**
 * Grade all answers for a single student against the question set.
 * Returns per-question breakdown + total score.
 */
export async function gradeStudentAnswers(
  questions: Question[],
  answers: AnswerMap
): Promise<{ breakdown: GradedAnswer[]; totalScore: number; maxScore: number }> {
  const breakdown = await Promise.all(
    questions.map((q) => gradeOne(q, answers[q.id] ?? ""))
  );

  const totalScore = breakdown.reduce((s, b) => s + b.awarded, 0);
  const maxScore = questions.reduce((s, q) => s + q.marks, 0);

  return { breakdown, totalScore, maxScore };
}

// ── Per-question graders ───────────────────────────────────────────────────────

async function gradeOne(question: Question, answer: string): Promise<GradedAnswer> {
  if (question.type === "mcq") {
    return gradeMCQ(question, answer);
  }
  return gradeShortAnswer(question, answer);
}

function gradeMCQ(question: Question, answer: string): GradedAnswer {
  const correct = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
  return {
    questionId: question.id,
    awarded: correct ? question.marks : 0,
    max: question.marks,
  };
}

const ShortAnswerGradeSchema = z.object({
  score: z.number().min(0),
  justification: z.string(),
});

async function gradeShortAnswer(question: Question, answer: string): Promise<GradedAnswer> {
  if (!answer.trim()) {
    return { questionId: question.id, awarded: 0, max: question.marks, justification: "No answer provided." };
  }

  const prompt = `You are a teacher grading a short-answer question. Score the student's answer on a scale of 0 to ${question.marks}.

Question: ${question.text}
Expected key points: ${question.correctAnswer}
Student's answer: ${answer}

Return JSON:
{
  "score": <number from 0 to ${question.marks}>,
  "justification": "<one sentence explaining the score>"
}`;

  try {
    const result = await generateJSON<{ score: number; justification: string }>({
      prompt,
      maxNewTokens: 150,
      temperature: 0.1,
    });
    const parsed = ShortAnswerGradeSchema.parse(result);
    const awarded = Math.min(question.marks, Math.max(0, Math.round(parsed.score)));
    return {
      questionId: question.id,
      awarded,
      max: question.marks,
      justification: parsed.justification,
    };
  } catch {
    // Fallback: award 0 if LLM grading fails — logged implicitly via thrown error
    return {
      questionId: question.id,
      awarded: 0,
      max: question.marks,
      justification: "Grading unavailable — please review manually.",
    };
  }
}
