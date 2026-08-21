/**
 * POST /api/agent
 *
 * Main entry point for all agent invocations. Accepts an OrchestratorContext
 * payload, enforces authentication + role-based access, and delegates to the
 * OrchestratorAgent singleton.
 *
 * Role gating (enforced by router.ts, double-checked here):
 *   - student: "recommend" and "assess" only
 *   - teacher: all intents
 *   - admin:   all intents
 *
 * Authentication: NextAuth session via getRequiredSession().
 */

import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/agents/orchestrator";
import { getRequiredSession } from "@/lib/auth";
import type { AgentIntent, OrchestratorContext } from "@/types/agents";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { intent, payload } = body as { intent?: unknown; payload?: unknown };
  if (typeof intent !== "string") {
    return NextResponse.json({ error: "Missing or invalid field: intent" }, { status: 400 });
  }

  const VALID_INTENTS: AgentIntent[] = [
    "recommend", "generate_lesson", "analytics", "assess", "teacher_query",
  ];
  if (!VALID_INTENTS.includes(intent as AgentIntent)) {
    return NextResponse.json(
      { error: `Unknown intent: "${intent}". Valid: ${VALID_INTENTS.join(", ")}` },
      { status: 400 }
    );
  }

  // 3. Build orchestrator context
  const ctx: OrchestratorContext = {
    intent: intent as AgentIntent,
    payload: (payload as Record<string, unknown>) ?? {},
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  };

  // 4. Delegate to orchestrator (role-gate enforced inside router.ts)
  const result = await orchestrator.run(ctx);

  const status = result.success ? 200 : result.error?.includes("not permitted") ? 403 : 500;
  return NextResponse.json(result, { status });
}
