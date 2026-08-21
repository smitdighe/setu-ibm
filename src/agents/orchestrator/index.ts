/**
 * OrchestratorAgent — the central coordinator for the Setu platform.
 *
 * Responsibilities:
 *   1. Accept all inbound agent requests via run().
 *   2. Enforce role-based access (via router.ts).
 *   3. Delegate to the correct domain agent (via router.ts + agent registry).
 *   4. Fire the post-assessment support-detection trigger when intent === "assess".
 *   5. Provide shared context helpers (student cache, curriculum map) to callers.
 *
 * This class implements BobAgent<OrchestratorContext, OrchestratorResult>
 * and is the only entry point the Next.js API layer needs to call.
 */

import type { BobAgent, AgentTool, OrchestratorContext, OrchestratorResult } from "@/types/agents";
import { routeToAgent } from "./router";
import { firePostAssessmentTrigger } from "./triggers";

export class OrchestratorAgent implements BobAgent<OrchestratorContext, OrchestratorResult> {
  readonly name = "orchestrator";
  readonly description =
    "Central coordinator. Routes requests to domain agents, enforces role-based access, and fires post-assessment triggers.";
  readonly tools: AgentTool[] = [];

  async run(ctx: OrchestratorContext): Promise<OrchestratorResult> {
    try {
      // Delegate to the correct domain agent via the router
      const result = await routeToAgent(ctx);

      // After a successful assess cycle, fire the async analytics trigger
      if (ctx.intent === "assess" && result.success) {
        const { classId, subjectId } = ctx.payload as {
          classId?: string;
          subjectId?: string;
        };
        if (classId && subjectId) {
          // Fire-and-forget — does NOT block the response
          firePostAssessmentTrigger(classId, ctx.schoolId, subjectId);
        }
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        intent: ctx.intent,
        error: message,
      };
    }
  }
}

/** Singleton instance used by the API layer */
export const orchestrator = new OrchestratorAgent();
