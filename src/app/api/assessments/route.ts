/**
 * POST /api/assessments — create + trigger assessment
 * GET  /api/assessments — list assessments for a class
 */

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth";
import { orchestrator } from "@/agents/orchestrator";
import { getAssessmentsByClass } from "@/lib/db/assessment";

export const POST = withRole(["teacher", "admin"], async (req, _ctx, session) => {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Safely normalise lang from the request body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBody = body as any;
  const lang = rawBody?.lang === "gu" ? "gu" : "en";

  const result = await orchestrator.run({
    intent: "assess",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: { ...(body as any), lang },
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  });

  return NextResponse.json(result, { status: result.success ? 201 : 500 });
});

export const GET = withRole(["teacher", "admin"], async (req, _ctx, session) => {
  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 });

  const assessments = await getAssessmentsByClass(classId, session.schoolId);
  return NextResponse.json({ assessments });
});
