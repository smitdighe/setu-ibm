/**
 * POST /api/chat
 *
 * Teacher Assistant conversational endpoint.
 * Accepts a natural-language message, runs it through TeacherAssistantAgent
 * via the orchestrator, and returns { reply, actionButtons?, data? }.
 *
 * Access: teacher + admin only.
 * Authentication: NextAuth session via getRequiredSession().
 */

import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/agents/orchestrator";
import { getRequiredSession } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (session.role === "student") {
    return NextResponse.json({ error: "Students cannot access the teacher chat" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, sessionId, classId, lang } = body as {
    message?: string; sessionId?: string; classId?: string; lang?: string;
  };

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Missing or empty field: message" }, { status: 400 });
  }

  const safeLang = lang === "gu" ? "gu" : "en";

  const result = await orchestrator.run({
    intent: "teacher_query",
    payload: {
      message: message.trim(),
      sessionId: sessionId ?? `${session.userId}_default`,
      classId: classId ?? "",
      schoolId: session.schoolId,
      userId: session.userId,
      lang: safeLang,
    },
    schoolId: session.schoolId,
    userId: session.userId,
    role: session.role,
  });

  const status = result.success ? 200 : 500;
  return NextResponse.json(result, { status });
}
