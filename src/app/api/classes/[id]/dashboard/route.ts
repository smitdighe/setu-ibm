/**
 * GET /api/classes/[id]/dashboard
 *
 * Class-level analytics + skill distribution for the teacher dashboard.
 * Teacher + admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth";
import { orchestrator } from "@/agents/orchestrator";
import { getClassById } from "@/lib/db/class";

export const GET = withRole(["teacher", "admin"], async (req, { params }, session) => {
  const id = (params as { id: string }).id;
  const cls = await getClassById(id);
  if (!cls || cls.schoolId !== session.schoolId) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const subjectId = req.nextUrl.searchParams.get("subjectId") ?? cls.subjectId;

  const result = await orchestrator.run({
    intent: "analytics",
    payload: { classId: id, subjectId },
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  });

  return NextResponse.json({ class: cls, analytics: result.data }, { status: result.success ? 200 : 500 });
});
