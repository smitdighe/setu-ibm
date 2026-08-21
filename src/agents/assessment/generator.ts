/**
 * generator.ts — Granite LLM question generation for assessments.
 *
 * Prompt strategy:
 *   - Asks Granite to return a strict JSON object matching the Question[] schema.
 *   - Splits the requested count ~60% MCQ / ~40% short answer.
 *   - Validates with Zod before returning — rejects malformed LLM output.
 *
 * ASSUMPTION: NCERT curriculum is referenced in the prompt for India-relevant
 * question phrasing. Swap "NCERT" with another standard if needed.
 */

import { generateJSON } from "@/lib/ibm/watsonx";
import { GeneratedQuestionsSchema } from "@/lib/db/schemas";
import type { Question } from "@/types/entities";

export type GeneratorInput = {
  topicId: string;
  subjectId: string;
  grade: number;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  /** Language for generated content — "en" (default) or "gu" (Gujarati) */
  lang?: "en" | "gu";
  /** Question type split — "mcq" (all MCQ), "short_answer" (all SA), "mixed" (default 60/40) */
  questionType?: "mcq" | "short_answer" | "mixed";
};

/**
 * Generate a list of questions for the given topic/difficulty using Granite.
 * Returns validated Question[]. Throws if LLM output fails Zod validation.
 */
export async function generateQuestions(input: GeneratorInput): Promise<Question[]> {
  const qt = input.questionType ?? "mixed";
  const mcqCount =
    qt === "mcq" ? input.questionCount :
    qt === "short_answer" ? 0 :
    Math.ceil(input.questionCount * 0.6);
  const saCount = input.questionCount - mcqCount;

  const langInstruction =
    (input.lang ?? "en") === "gu"
      ? "IMPORTANT: Write all question text and answer options in Gujarati (ગુજરાતી) script. Do NOT use English for question text or options."
      : "Write all question text and options in English.";

  const prompt = `You are an expert educator creating a ${input.difficulty} difficulty assessment for Grade ${input.grade} students.
Subject: ${input.subjectId}
Topic: ${input.topicId}
Curriculum: NCERT (India)
Language instruction: ${langInstruction}

Generate exactly ${mcqCount} multiple-choice questions (MCQ) and ${saCount} short-answer questions.

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "text": "Question text here",
      "options": [
        {"id": "a", "text": "Option A"},
        {"id": "b", "text": "Option B"},
        {"id": "c", "text": "Option C"},
        {"id": "d", "text": "Option D"}
      ],
      "correctAnswer": "a",
      "marks": 1
    },
    {
      "id": "q${mcqCount + 1}",
      "type": "short_answer",
      "text": "Question text here",
      "correctAnswer": "Expected answer or key points",
      "marks": 3
    }
  ]
}

Rules:
- ${langInstruction}
- MCQ correctAnswer must be the option id ("a", "b", "c", or "d").
- Short-answer correctAnswer should be key points the student should mention.
- ${input.difficulty === "easy" ? "Focus on recall and basic understanding." : input.difficulty === "medium" ? "Include application questions." : "Include analysis and evaluation questions."}
- Do NOT include any text outside the JSON object.`;

  const raw = await generateJSON<{ questions: Question[] }>({ prompt, maxNewTokens: 2048 });

  // Validate with Zod — prevents corrupted data entering Cloudant
  const parsed = GeneratedQuestionsSchema.parse(raw);
  return parsed.questions;
}
