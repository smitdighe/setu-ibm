/**
 * GET /api/recommendations/[studentId]
 *
 * Personalised resource recommendations for a student.
 * Teachers/admins can view any student. Students can only view themselves.
 *
 * Query params:
 *   subjectId — required
 */

import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth";
import { orchestrator } from "@/agents/orchestrator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
): Promise<NextResponse> {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { studentId } = await params;

  if (session.role === "student" && session.userId !== studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });

  const result = await orchestrator.run({
    intent: "recommend",
    payload: { studentId, subjectId },
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
