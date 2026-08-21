/**
 * generator.ts — Granite LLM content generation for differentiated lesson plans.
 *
 * Generates three separate ContentBlocks — one per skill level — using targeted
 * prompts. Each prompt receives: topic, grade, curriculum standard, and a
 * description of what the target learner group needs.
 *
 * ASSUMPTION: Content is generated in English. Teacher may translate sections
 * to Gujarati manually before publishing (no automated translation in this build).
 */

import { generateJSON } from "@/lib/ibm/watsonx";
import { ContentBlockSchema } from "@/lib/db/schemas";
import { z } from "zod";
import type { ContentBlock, ContentLevel } from "@/types/entities";

type GeneratorInput = {
  topicId: string;
  subjectId: string;
  grade: number;
  curriculumStandard: string;
  level: ContentLevel;
  /** Language for generated content — "en" (default) or "gu" (Gujarati) */
  lang?: "en" | "gu";
};

const GeneratedBlockSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  activity: z.string().min(1),
  worksheet: z.string().min(1),
  estimatedMinutes: z.number().int().min(5),
});

const LEVEL_DESCRIPTIONS: Record<ContentLevel, string> = {
  remedial:
    "Students who are struggling and need foundational support. Use very simple language, concrete examples, step-by-step instructions, and visual/hands-on activities. Assume minimal prior knowledge.",
  on_track:
    "Students at the expected grade level. Use standard curriculum language, mix of examples and practice questions, and application activities.",
  advanced:
    "Students who have mastered the basics and need enrichment. Use challenging questions, real-world problem solving, and extension activities that connect to higher-level concepts.",
};

/**
 * Generate one ContentBlock for a given skill level via Granite LLM.
 */
export async function generateContentBlock(input: GeneratorInput): Promise<ContentBlock> {
  const { topicId, subjectId, grade, curriculumStandard = "NCERT Class 6", level, lang } = input;
  const audienceDesc = LEVEL_DESCRIPTIONS[level];

  const langInstruction =
    (lang ?? "en") === "gu"
      ? "IMPORTANT: Write all text values (title, explanation, activity, worksheet) in Gujarati (ગુજરાતી) script. Do NOT use English for any text values."
      : "Write all text values in English.";

  const prompt = `You are an experienced teacher creating a lesson plan for Grade ${grade} students in rural India.
Subject: ${subjectId}
Topic: ${topicId}
Curriculum standard: ${curriculumStandard}
Target audience: ${audienceDesc}
Language instruction: ${langInstruction}

Generate a lesson plan content block in JSON with this exact structure:
{
  "title": "<brief title for this section, e.g. 'Introduction to Fractions for Beginners'>",
  "explanation": "<clear explanation of the topic suitable for this audience, 3-5 sentences>",
  "activity": "<one hands-on classroom activity the teacher can run in 10-15 minutes>",
  "worksheet": "<3-5 practice questions or tasks the student can do independently>",
  "estimatedMinutes": <total time in minutes for this content block, integer>
}

Rules:
- ${langInstruction}
- The worksheet should have numbered questions.
- estimatedMinutes should be between 20 and 45.
- Do NOT include any text outside the JSON object.`;

  const raw = await generateJSON<Record<string, unknown>>({ prompt, maxNewTokens: 1024 });

  // Validate Zod — prevents malformed LLM output entering Cloudant
  const parsed = GeneratedBlockSchema.parse(raw);

  return {
    level,
    title: parsed.title,
    explanation: parsed.explanation,
    activity: parsed.activity,
    worksheet: parsed.worksheet,
    estimatedMinutes: parsed.estimatedMinutes,
  };
}

/**
 * Generate all three differentiation levels in parallel.
 * Returns [remedial, on_track, advanced] ContentBlocks.
 */
export async function generateAllLevels(
  input: Omit<GeneratorInput, "level">
): Promise<ContentBlock[]> {
  const levels: ContentLevel[] = ["remedial", "on_track", "advanced"];
  return Promise.all(levels.map((level) => generateContentBlock({ ...input, level })));
}

export type { GeneratorInput };
