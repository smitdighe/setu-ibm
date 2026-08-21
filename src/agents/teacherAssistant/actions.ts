/**
 * actions.ts — maps classified intents to orchestrator calls and builds
 * structured replies with optional action buttons.
 *
 * Each handler calls the orchestrator (not domain agents directly) to keep
 * all auth/routing logic centralised.
 */

import { orchestrator } from "@/agents/orchestrator";
import type { ActionButton, TeacherQueryOutput, ExtractedEntities } from "./types";
import type { UserRole } from "@/types/agents";
import type { Student } from "@/types/entities";
import type { AnalyticsOutput } from "@/agents/analytics/types";

type ActionContext = {
  entities: ExtractedEntities;
  schoolId: string;
  userId: string;
  role: UserRole;
  lang?: "en" | "gu";
};

export async function dispatchAction(ctx: ActionContext): Promise<TeacherQueryOutput> {
  const { entities, schoolId, userId, role, lang } = ctx;
  const { intent, classId, subjectId, topicId } = entities;

  switch (intent) {
    case "get_at_risk":
      return handleGetAtRisk({ classId, subjectId, schoolId, userId, role, lang });

    case "get_progress":
      return handleGetProgress({ classId, subjectId, schoolId, userId, role });

    case "generate_lesson":
      return handleGenerateLesson({ classId, subjectId, topicId, schoolId, userId, role, lang });

    case "generate_worksheet":
    case "generate_quiz":
      return handleGenerateQuiz({ classId, subjectId, topicId, schoolId, userId, role, isWorksheet: intent === "generate_worksheet", lang });

    default:
      return {
        reply: "I'm not sure what you're asking. Try: 'Show me at-risk students in Class 6A', 'Generate a lesson plan on fractions', or 'Create a quiz on decimals for Class 6B'.",
        actionButtons: [],
      };
  }
}

// ── Intent handlers ───────────────────────────────────────────────────────────

async function handleGetAtRisk(ctx: {
  classId?: string; subjectId?: string;
  schoolId: string; userId: string; role: UserRole; lang?: "en" | "gu";
}): Promise<TeacherQueryOutput> {
  const result = await orchestrator.run({
    intent: "analytics",
    payload: { classId: ctx.classId, subjectId: ctx.subjectId ?? "math" },
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
  });

  if (!result.success) {
    return { reply: `Could not fetch analytics: ${result.error}` };
  }

  const data = result.data as AnalyticsOutput;
  const dist = data.skillDistribution;
  const atRiskCount = dist?.remedial ?? 0;

  const reply =
    atRiskCount === 0
      ? `Good news — no students are currently flagged as at-risk in ${ctx.classId ?? "this class"}.`
      : `${atRiskCount} student${atRiskCount > 1 ? "s are" : " is"} in the remedial band in ${ctx.classId ?? "this class"}. ` +
        `The class breakdown is: ${dist.remedial} remedial, ${dist.onTrack} on-track, ${dist.advanced} advanced.`;

  const buttons: ActionButton[] = atRiskCount > 0
    ? [
        {
          label: "Generate Remedial Lesson Plan",
          intent: "generate_lesson",
          payload: { classId: ctx.classId, subjectId: ctx.subjectId ?? "math", level: "remedial" },
        },
        {
          label: "Generate Remedial Quiz",
          intent: "assess",
          payload: { classId: ctx.classId, subjectId: ctx.subjectId ?? "math", difficulty: "easy" },
        },
      ]
    : [];

  return { reply, actionButtons: buttons, data };
}

async function handleGetProgress(ctx: {
  classId?: string; subjectId?: string;
  schoolId: string; userId: string; role: UserRole;
}): Promise<TeacherQueryOutput> {
  const result = await orchestrator.run({
    intent: "analytics",
    payload: { classId: ctx.classId, subjectId: ctx.subjectId ?? "math" },
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
  });

  if (!result.success) return { reply: `Could not fetch progress: ${result.error}` };

  const data = result.data as AnalyticsOutput;
  const dist = data.skillDistribution;
  const reply =
    `Progress for ${ctx.classId ?? "this class"}: ` +
    `${dist.advanced} advanced, ${dist.onTrack} on-track, ${dist.remedial} need support. ` +
    `Overall average risk score: ${(data.riskScore * 100).toFixed(0)}%.`;

  return { reply, data };
}

async function handleGenerateLesson(ctx: {
  classId?: string; subjectId?: string; topicId?: string;
  schoolId: string; userId: string; role: UserRole; lang?: "en" | "gu";
}): Promise<TeacherQueryOutput> {
  const weekOf = getThisMonday();
  const result = await orchestrator.run({
    intent: "generate_lesson",
    payload: {
      classId: ctx.classId,
      subjectId: ctx.subjectId ?? "math",
      grade: 6,               // ASSUMPTION: Grade 6 default; Sub-Task 9 resolves from class doc
      topicId: ctx.topicId ?? "general",
      weekOf,
      skillDistribution: { remedial: 1, onTrack: 1, advanced: 1 },
      curriculumStandard: `NCERT Grade 6 — ${ctx.topicId ?? ctx.subjectId ?? "topic"}`,
      lang: ctx.lang,
    },
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
  });

  if (!result.success) return { reply: `Could not generate lesson plan: ${result.error}` };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = result.data as any;
  const reply =
    `Lesson plan generated for ${ctx.topicId ?? ctx.subjectId ?? "the topic"} (week of ${weekOf}). ` +
    `It includes remedial, on-track, and advanced sections. ` +
    (output?.fromCache ? "Served from cache." : "Freshly generated and saved.");

  return {
    reply,
    actionButtons: [{
      label: "View Lesson Plan",
      intent: "generate_lesson",
      payload: { lessonPlanId: output?.lessonPlanId, printableUrl: output?.printableUrl },
    }],
    data: result.data,
  };
}

async function handleGenerateQuiz(ctx: {
  classId?: string; subjectId?: string; topicId?: string;
  schoolId: string; userId: string; role: UserRole; isWorksheet: boolean; lang?: "en" | "gu";
}): Promise<TeacherQueryOutput> {
  const result = await orchestrator.run({
    intent: "assess",
    payload: {
      classId: ctx.classId,
      subjectId: ctx.subjectId ?? "math",
      topicId: ctx.topicId ?? "general",
      grade: 6,
      difficulty: "easy",
      studentMasteryLevel: 50,
      questionCount: ctx.isWorksheet ? 5 : 10,
      lang: ctx.lang,
    },
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    role: ctx.role,
  });

  if (!result.success) return { reply: `Could not generate ${ctx.isWorksheet ? "worksheet" : "quiz"}: ${result.error}` };

  const label = ctx.isWorksheet ? "worksheet" : "quiz";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = result.data as any;
  const qCount = output?.questions?.length ?? 0;
  const reply = `${qCount}-question ${label} generated for ${ctx.topicId ?? ctx.subjectId ?? "the topic"}. ` +
    `All feedback is stored as pending review — approve it in the Assessments tab before students see it.`;

  return { reply, data: result.data };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getThisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}
