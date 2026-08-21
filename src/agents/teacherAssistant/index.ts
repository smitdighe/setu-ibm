/**
 * TeacherAssistantAgent — Granite-powered conversational assistant for teachers.
 *
 * Flow per message:
 *   1. Load session history (chat.ts — max 10 turns, in-memory).
 *   2. Extract intent + entities from the teacher's message (intent.ts).
 *   3. Dispatch to the correct orchestrator action (actions.ts).
 *   4. Generate a natural-language reply wrapping the structured data.
 *   5. Append both turns to session history.
 *   6. Return TeacherQueryOutput { reply, actionButtons?, data? }.
 */

import type { BobAgent, AgentTool } from "@/types/agents";
import type { TeacherQueryInput, TeacherQueryOutput } from "./types";
import { getHistory, appendTurn } from "./chat";
import { extractIntentAndEntities } from "./intent";
import { dispatchAction } from "./actions";

export class TeacherAssistantAgent implements BobAgent<TeacherQueryInput, TeacherQueryOutput> {
  readonly name = "teacherAssistant";
  readonly description =
    "Granite-powered conversational agent. Classifies teacher natural-language queries and routes them to the correct domain agent via the orchestrator.";
  readonly tools: AgentTool[] = [];

  async run(input: TeacherQueryInput): Promise<TeacherQueryOutput> {
    const { message, sessionId, classId, schoolId, userId, lang } = input;

    // 1. Load history
    const history = getHistory(sessionId);

    // 2. Extract intent + entities
    const entities = await extractIntentAndEntities(message, history, classId);

    // 3. Dispatch to action handler
    const output = await dispatchAction({
      entities,
      schoolId,
      userId,
      role: "teacher",
      lang,
    });

    // 4. Append turns to session history
    appendTurn(sessionId, { role: "teacher", content: message, timestamp: new Date().toISOString() });
    appendTurn(sessionId, { role: "assistant", content: output.reply, timestamp: new Date().toISOString() });

    return output;
  }
}

export const teacherAssistantAgent = new TeacherAssistantAgent();
