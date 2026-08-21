/**
 * Agent registry — registers all domain agents with the orchestrator.
 *
 * Each domain agent is imported here as it is built (Sub-Tasks 4–8).
 * Stubs are used during the skeleton phase so the orchestrator can compile
 * and route; each stub is replaced in its respective sub-task.
 *
 * ASSUMPTION: Stub agents return a "not_implemented" payload so the API
 * returns a clear error rather than silently failing during development.
 */

import type { BobAgent } from "@/types/agents";

// ── Stub factory ──────────────────────────────────────────────────────────────
// Creates a typed no-op agent that signals it is not yet implemented.
// Replaced one-by-one as Sub-Tasks 4–8 are completed.
function stubAgent<I, O>(agentName: string): BobAgent<I, O> {
  return {
    name: agentName,
    description: `[STUB] ${agentName} — not yet implemented`,
    tools: [],
    run: async (_input: I): Promise<O> => {
      throw new Error(`Agent "${agentName}" is not yet implemented. Complete the corresponding sub-task.`);
    },
  };
}

// ── Domain agent imports (uncomment as each sub-task is completed) ─────────────
import { analyticsAgent as _analyticsAgent } from "./analytics";
import { assessmentAgent as _assessmentAgent } from "./assessment";
import { lessonPlanAgent as _lessonPlanAgent } from "./lessonPlan";
import { recommendationAgent as _recommendationAgent } from "./recommendation";
import { teacherAssistantAgent as _teacherAssistantAgent } from "./teacherAssistant";

// ── Agent instances ────────────────────────────────────────────────────────────
export const analyticsAgent: BobAgent<any, any> = _analyticsAgent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assessmentAgent: BobAgent<any, any> = _assessmentAgent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lessonPlanAgent: BobAgent<any, any> = _lessonPlanAgent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const recommendationAgent: BobAgent<any, any> = _recommendationAgent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const teacherAssistantAgent: BobAgent<any, any> = _teacherAssistantAgent;

/** Map from intent name to the agent that handles it */
export const agentRegistry = {
  analytics: analyticsAgent,
  assess: assessmentAgent,
  generate_lesson: lessonPlanAgent,
  recommend: recommendationAgent,
  teacher_query: teacherAssistantAgent,
} as const;

export type AgentRegistry = typeof agentRegistry;
