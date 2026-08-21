/**
 * Post-assessment support-detection trigger.
 *
 * After AssessmentAgent completes a grading cycle, the orchestrator calls
 * firePostAssessmentTrigger() asynchronously (fire-and-forget, no await)
 * so the student's submission response is not delayed.
 *
 * What the trigger does:
 *   1. Calls AnalyticsAgent to recompute risk scores for every student in the class.
 *   2. For each student with riskScore > RISK_THRESHOLD, sets riskFlag = true
 *      (AnalyticsAgent.run() handles the Cloudant write via updateStudentRisk).
 *   3. Invalidates the student profile cache for the affected class.
 *
 * ASSUMPTION: Risk threshold is 0.7 (set in plan). Configurable via env var
 * RISK_FLAG_THRESHOLD if needed.
 */

import { agentRegistry } from "@/agents";
import { invalidateClass } from "./context";
import { getClassById } from "@/lib/db/class";
import type { AnalyticsInput } from "@/agents/analytics/types";

const RISK_THRESHOLD = parseFloat(process.env.RISK_FLAG_THRESHOLD ?? "0.7");

/**
 * Fire-and-forget: recompute analytics for a whole class after assessment.
 * Errors are logged but never thrown back to the caller.
 *
 * @param classId  — the class that just completed an assessment
 * @param schoolId — multi-tenant scope
 * @param subjectId — subject of the completed assessment
 */
export function firePostAssessmentTrigger(
  classId: string,
  schoolId: string,
  subjectId: string
): void {
  // Intentionally not awaited — run in background
  void runTrigger(classId, schoolId, subjectId).catch((err) => {
    console.error("[Trigger] Post-assessment trigger failed:", err);
  });
}

async function runTrigger(
  classId: string,
  schoolId: string,
  subjectId: string
): Promise<void> {
  // 1. Load class to get student list for cache invalidation
  const cls = await getClassById(classId);
  if (!cls) {
    console.warn(`[Trigger] Class ${classId} not found — skipping trigger`);
    return;
  }

  // 2. Call AnalyticsAgent for the whole class
  //    AnalyticsAgent.run() with no studentId computes class-level analytics
  //    and writes updated riskScore/riskFlag to each student in Cloudant.
  const analyticsInput: AnalyticsInput = {
    classId,
    subjectId,
    schoolId,
  };

  await agentRegistry.analytics.run(analyticsInput);

  // 3. Invalidate in-process student cache so fresh data is served next request
  invalidateClass(cls.studentIds);

  console.log(
    `[Trigger] Post-assessment analytics complete for class ${classId}. ` +
    `Risk threshold: ${RISK_THRESHOLD}. Cache invalidated for ${cls.studentIds.length} students.`
  );
}
