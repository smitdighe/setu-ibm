/**
 * intent.ts — Granite LLM intent classification + entity extraction.
 *
 * Classifies a teacher's natural-language query into one of 5 intents and
 * extracts entities (classId, subjectId, topicId) needed for the action handler.
 * Zod-validates the JSON output before use.
 */

import { generateJSON } from "@/lib/ibm/watsonx";
import { z } from "zod";
import type { ExtractedEntities, ConversationTurn, TeacherIntent } from "./types";
import { formatHistoryForPrompt } from "./chat";

const VALID_INTENTS: TeacherIntent[] = [
  "get_at_risk", "generate_worksheet", "generate_lesson",
  "get_progress", "generate_quiz",
];

const ExtractedSchema = z.object({
  intent: z.enum([
    "get_at_risk", "generate_worksheet", "generate_lesson",
    "get_progress", "generate_quiz", "unknown",
  ]),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  confidence: z.enum(["high", "low"]),
});

export async function extractIntentAndEntities(
  message: string,
  history: ConversationTurn[],
  contextClassId: string
): Promise<ExtractedEntities> {
  const historyStr = formatHistoryForPrompt(history);

  const prompt = `${historyStr}You are a school management assistant for Gujarat government schools.
A teacher sent this message: "${message}"

Classify the intent and extract entities. Respond with JSON only:
{
  "intent": one of [${VALID_INTENTS.map((i) => `"${i}"`).join(", ")}, "unknown"],
  "classId": "<class id if mentioned, else null>",
  "subjectId": "<subject like 'math' or 'science' if mentioned, else null>",
  "topicId": "<specific topic like 'fractions' if mentioned, else null>",
  "confidence": "high" if intent is clear, "low" if ambiguous
}

Intent definitions:
- get_at_risk: teacher wants to see which students are struggling or falling behind
- generate_worksheet: teacher wants a worksheet or practice material for students
- generate_lesson: teacher wants a lesson plan for a topic
- get_progress: teacher wants progress/performance data for students
- generate_quiz: teacher wants a quiz or assessment created
- unknown: query does not match any of the above`;

  try {
    const raw = await generateJSON<Record<string, unknown>>({ prompt, maxNewTokens: 200, temperature: 0.1 });
    const parsed = ExtractedSchema.parse(raw);
    return {
      ...parsed,
      classId: parsed.classId ?? contextClassId,
    };
  } catch {
    // Fallback on parse failure
    return { intent: "unknown", classId: contextClassId, confidence: "low" };
  }
}
