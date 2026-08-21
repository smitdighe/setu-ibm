/**
 * GET /api/students?classId=xxx
 *
 * Returns all students in a class. Teacher + admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth";
import { getStudentsByClass } from "@/lib/db/student";

export const GET = withRole(["teacher", "admin"], async (req, _ctx, session) => {
  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 });

  const students = await getStudentsByClass(classId, session.schoolId);
  // Strip passwordHash from response
  const safe = students.map(({ passwordHash: _ph, ...s }) => s);
  return NextResponse.json({ students: safe });
});
