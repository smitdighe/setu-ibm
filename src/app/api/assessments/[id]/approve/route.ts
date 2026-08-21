/**
 * PATCH /api/assessments/[id]/approve
 *
 * Teacher approves LLM-generated feedback for a student — audit trail action.
 * Sets feedbackStatus: "approved" so feedback becomes visible to the student.
 *
 * Body: { studentId: string, status?: "approved" | "rejected" }
 */

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth";
import { getAssessmentById, updateFeedbackStatus } from "@/lib/db/assessment";

export const PATCH = withRole(["teacher", "admin"], async (req, { params }, session) => {
  const id = (params as { id: string }).id;

  let body: { studentId?: string; status?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { studentId, status = "approved" } = body;
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "status must be 'approved' or 'rejected'" }, { status: 400 });
  }

  const assessment = await getAssessmentById(id);
  if (!assessment || assessment.schoolId !== session.schoolId) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  await updateFeedbackStatus(id, studentId, status as "approved" | "rejected");
  return NextResponse.json({ success: true, assessmentId: id, studentId, status });
});
