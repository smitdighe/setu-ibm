/**
 * Orchestrator router — maps an AgentIntent to the correct domain agent's
 * run() call.
 *
 * During the skeleton phase (Sub-Tasks 1–3), all domain agents are stubs.
 * As Sub-Tasks 4–8 replace the stubs in src/agents/index.ts, the routing
 * logic here requires no changes — it delegates entirely through the registry.
 *
 * Role-based intent gating:
 *   - student: "recommend", "assess" only
 *   - teacher / admin: all intents
 */

import { agentRegistry } from "@/agents";
import type { AgentIntent, OrchestratorContext, OrchestratorResult, UserRole } from "@/types/agents";

// ── Access control ─────────────────────────────────────────────────────────────

const STUDENT_ALLOWED_INTENTS: AgentIntent[] = ["recommend", "assess"];

function assertRoleAllowed(intent: AgentIntent, role: UserRole): void {
  if (role === "student" && !STUDENT_ALLOWED_INTENTS.includes(intent)) {
    throw new Error(
      `Role "${role}" is not permitted to call intent "${intent}". ` +
      `Students may only use: ${STUDENT_ALLOWED_INTENTS.join(", ")}.`
    );
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

/**
 * Route a context to the correct agent and return its result.
 * Throws on unknown intent or role violation.
 */
export async function routeToAgent(
  ctx: OrchestratorContext
): Promise<OrchestratorResult> {
  assertRoleAllowed(ctx.intent, ctx.role);

  const agent = agentRegistry[ctx.intent];
  if (!agent) {
    throw new Error(`Unknown intent: "${ctx.intent}"`);
  }

  // Build the typed input by merging the payload with shared context fields
  const input = {
    ...ctx.payload,
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
  };

  const data = await agent.run(input);

  return {
    success: true,
    intent: ctx.intent,
    data,
  };
}
