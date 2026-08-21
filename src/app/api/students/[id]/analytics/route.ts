/**
 * GET /api/students/[id]/analytics
 *
 * Student-level analytics. Teacher + admin can view any student.
 * Students can only view themselves.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth";
import { orchestrator } from "@/agents/orchestrator";
import { getStudentById } from "@/lib/db/student";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;

  // Students can only see their own analytics
  if (session.role === "student" && session.userId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await getStudentById(id);
  if (!student || student.schoolId !== session.schoolId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const subjectId = req.nextUrl.searchParams.get("subjectId") ?? "math";

  const result = await orchestrator.run({
    intent: "analytics",
    payload: { studentId: id, classId: student.classId, subjectId },
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
