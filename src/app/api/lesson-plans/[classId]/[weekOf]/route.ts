/**
 * GET /api/lesson-plans/[classId]/[weekOf]
 *
 * Fetch (or generate) a lesson plan for a class + week.
 * Cache-first: returns from COS if available, else calls LessonPlanAgent.
 * Teacher + admin only.
 *
 * Query params:
 *   subjectId  — required
 *   topicId    — optional (defaults to first weak topic or "general")
 *   generate   — "true" to force regeneration even if cached
 */

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth";
import { orchestrator } from "@/agents/orchestrator";
import { getLessonPlan } from "@/lib/db/lessonPlan";
import { getClassById } from "@/lib/db/class";

export const GET = withRole(["teacher", "admin"], async (req, { params }, session) => {
  const { classId, weekOf } = await params as { classId: string; weekOf: string };
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const topicId = req.nextUrl.searchParams.get("topicId") ?? "general";
  const forceRegen = req.nextUrl.searchParams.get("generate") === "true";
  const rawLang = req.nextUrl.searchParams.get("lang");
  const lang = rawLang === "gu" ? "gu" : "en";

  if (!subjectId) return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });

  // Try Cloudant metadata cache first (avoids COS head request)
  if (!forceRegen) {
    const existing = await getLessonPlan(classId, subjectId, weekOf, session.schoolId);
    if (existing) return NextResponse.json({ lessonPlan: existing, fromCache: true });
  }

  const cls = await getClassById(classId);

  const result = await orchestrator.run({
    intent: "generate_lesson",
    payload: {
      classId,
      subjectId,
      grade: cls?.grade ?? 6,
      topicId,
      weekOf,
      skillDistribution: cls?.skillDistribution ?? { remedial: 1, onTrack: 1, advanced: 1 },
      curriculumStandard: `NCERT Grade ${cls?.grade ?? 6} — ${topicId}`,
      lang,
    },
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
});
