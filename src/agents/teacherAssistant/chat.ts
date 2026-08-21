/**
 * chat.ts — in-process conversation history store.
 *
 * Keyed by sessionId. Max 10 turns retained per session (oldest evicted).
 * No persistence — resets on Code Engine container restart, which is
 * acceptable per plan (graceful degradation, not a hard requirement).
 */

import type { ConversationTurn } from "./types";

const MAX_TURNS = 10;
const sessions = new Map<string, ConversationTurn[]>();

export function getHistory(sessionId: string): ConversationTurn[] {
  return sessions.get(sessionId) ?? [];
}

export function appendTurn(sessionId: string, turn: ConversationTurn): void {
  const history = sessions.get(sessionId) ?? [];
  history.push(turn);
  // Evict oldest when over limit
  if (history.length > MAX_TURNS) history.splice(0, history.length - MAX_TURNS);
  sessions.set(sessionId, history);
}

/**
 * Serialise history for injection into a Granite prompt.
 * Returns a compact multi-line string — empty string when history is empty.
 */
export function formatHistoryForPrompt(history: ConversationTurn[]): string {
  if (history.length === 0) return "";
  return (
    "Previous conversation:\n" +
    history.map((t) => `${t.role === "teacher" ? "Teacher" : "Assistant"}: ${t.content}`).join("\n") +
    "\n\n"
  );
}
