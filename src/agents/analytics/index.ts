/**
 * AnalyticsAgent — computes mastery scores, risk scores, trend data, and
 * class-level skill distributions.
 *
 * Called by:
 *   - OrchestratorAgent.triggers.ts after every assessment cycle (class-level)
 *   - Teacher Dashboard API for a single student's detail view
 *   - LessonPlanAgent to get skillDistribution before generating content blocks
 *
 * run() accepts AnalyticsInput. When studentId is provided it runs student-level
 * analytics only. When omitted it runs class-level analytics for all students in
 * the class, updating riskFlag/riskScore for each in Cloudant.
 */

import type { BobAgent, AgentTool } from "@/types/agents";
import type { AnalyticsInput, AnalyticsOutput, TopicMastery } from "./types";
import { computeAllTopicMastery } from "./mastery";
import { computeRiskScore } from "./risk";
import { computeSkillDistribution, computeStudentAverage } from "./cohort";
import { getStudentsByClass, getStudentById, updateStudentRisk, updateStudent } from "@/lib/db/student";
import { getAssessmentsByClass, getAssessmentsByTopic } from "@/lib/db/assessment";
import { updateSkillDistribution } from "@/lib/db/class";
import type { SkillDistribution } from "@/types/entities";

export class AnalyticsAgent implements BobAgent<AnalyticsInput, AnalyticsOutput> {
  readonly name = "analytics";
  readonly description =
    "Computes per-student mastery scores, risk scores, trend data, and class-level skill distributions from assessment history.";
  readonly tools: AgentTool[] = [];

  async run(input: AnalyticsInput): Promise<AnalyticsOutput> {
    const { studentId, classId, subjectId, schoolId } = input;

    if (studentId) {
      return this.runForStudent(studentId, classId, subjectId, schoolId);
    }
    return this.runForClass(classId, subjectId, schoolId);
  }

  // ── Student-level analytics ────────────────────────────────────────────────

  private async runForStudent(
    studentId: string,
    classId: string,
    subjectId: string,
    schoolId: string
  ): Promise<AnalyticsOutput> {
    const student = await getStudentById(studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    // Collect all topic IDs this student has been assessed on
    const assessments = await getAssessmentsByClass(classId, schoolId);
    const topicIds = [
      ...new Set(
        assessments
          .filter((a) => a.subjectId === subjectId)
          .map((a) => a.topicId)
      ),
    ];

    const masteryByTopic = await computeAllTopicMastery(
      studentId,
      subjectId,
      classId,
      schoolId,
      topicIds
    );

    // Build trendData: rolling average per assessment date
    const trendData = buildTrendData(studentId, assessments.filter((a) => a.subjectId === subjectId));

    const riskResult = await computeRiskScore({
      studentId,
      classId,
      schoolId,
      masteryByTopic,
      learningPace: student.learningPace,
    });

    // Persist updated risk scores + mastery map to Cloudant
    await updateStudentRisk(studentId, riskResult.riskScore, riskResult.riskFlag);

    // Update subjectMastery map on the student document
    const updatedMastery = {
      ...student.subjectMastery,
      [subjectId]: Object.fromEntries(
        masteryByTopic.map((t) => [t.topicId, t.score])
      ),
    };
    await updateStudent({ ...student, subjectMastery: updatedMastery });

    // Skill distribution for single student is not meaningful — return zeroes
    // (caller should use class-level analytics for distribution)
    const skillDistribution: SkillDistribution = { remedial: 0, onTrack: 0, advanced: 0 };

    return {
      studentId,
      masteryByTopic,
      trendData,
      riskScore: riskResult.riskScore,
      riskFlag: riskResult.riskFlag,
      skillDistribution,
    };
  }

  // ── Class-level analytics ──────────────────────────────────────────────────

  private async runForClass(
    classId: string,
    subjectId: string,
    schoolId: string
  ): Promise<AnalyticsOutput> {
    const students = await getStudentsByClass(classId, schoolId);
    if (students.length === 0) {
      return {
        masteryByTopic: [],
        trendData: [],
        riskScore: 0,
        riskFlag: false,
        skillDistribution: { remedial: 0, onTrack: 0, advanced: 0 },
      };
    }

    const assessments = await getAssessmentsByClass(classId, schoolId);
    const topicIds = [
      ...new Set(
        assessments
          .filter((a) => a.subjectId === subjectId)
          .map((a) => a.topicId)
      ),
    ];

    // Compute mastery + risk for every student in parallel
    const studentResults = await Promise.all(
      students.map(async (student) => {
        const masteryByTopic = await computeAllTopicMastery(
          student._id!,
          subjectId,
          classId,
          schoolId,
          topicIds
        );
        const riskResult = await computeRiskScore({
          studentId: student._id!,
          classId,
          schoolId,
          masteryByTopic,
          learningPace: student.learningPace,
        });

        // Persist each student's risk scores
        await updateStudentRisk(student._id!, riskResult.riskScore, riskResult.riskFlag);

        return { student, masteryByTopic, riskResult };
      })
    );

    // Build class-level skill distribution
    const studentAverages = studentResults.map(({ student, masteryByTopic }) =>
      computeStudentAverage(
        student._id!,
        masteryByTopic.map((t) => ({ topicId: t.topicId, score: t.score }))
      )
    );
    const skillDistribution = computeSkillDistribution(studentAverages);

    // Persist updated skill distribution to the Class document
    await updateSkillDistribution(classId, skillDistribution);

    // Class-level aggregates (average across all students)
    const classAvgMastery = aggregateClassMastery(
      studentResults.map((r) => r.masteryByTopic)
    );
    const classAvgRisk =
      studentResults.reduce((s, r) => s + r.riskResult.riskScore, 0) /
      studentResults.length;

    const trendData = buildTrendData(
      undefined,
      assessments.filter((a) => a.subjectId === subjectId),
      students.map((s) => s._id!)
    );

    return {
      masteryByTopic: classAvgMastery,
      trendData,
      riskScore: classAvgRisk,
      riskFlag: classAvgRisk > parseFloat(process.env.RISK_FLAG_THRESHOLD ?? "0.7"),
      skillDistribution,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Aggregate topic mastery across multiple students into class averages.
 */
function aggregateClassMastery(
  allStudentMastery: TopicMastery[][]
): TopicMastery[] {
  const topicMap = new Map<string, { scores: number[]; trends: TopicMastery["trend"][] }>();
  for (const studentMastery of allStudentMastery) {
    for (const tm of studentMastery) {
      const existing = topicMap.get(tm.topicId) ?? { scores: [], trends: [] };
      existing.scores.push(tm.score);
      existing.trends.push(tm.trend);
      topicMap.set(tm.topicId, existing);
    }
  }
  return Array.from(topicMap.entries()).map(([topicId, { scores, trends }]) => {
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const decliningCount = trends.filter((t) => t === "declining").length;
    const improvingCount = trends.filter((t) => t === "improving").length;
    const trend: TopicMastery["trend"] =
      decliningCount > improvingCount
        ? "declining"
        : improvingCount > decliningCount
          ? "improving"
          : "stable";
    return { topicId, score: avgScore, trend };
  });
}

/**
 * Build trendData: one data point per assessment date showing the
 * average score percentage for the given student (or whole class).
 */
function buildTrendData(
  studentId: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assessments: any[],
  allStudentIds?: string[]
): { date: string; avgScore: number }[] {
  const byDate = new Map<string, number[]>();

  for (const a of assessments) {
    const responses = studentId
      ? a.studentResponses.filter((r: { studentId: string }) => r.studentId === studentId)
      : allStudentIds
        ? a.studentResponses.filter((r: { studentId: string }) => allStudentIds.includes(r.studentId))
        : a.studentResponses;

    for (const r of responses) {
      if (r.maxScore === 0) continue;
      const date = r.gradedAt.slice(0, 10); // YYYY-MM-DD
      const pct = (r.score / r.maxScore) * 100;
      const existing = byDate.get(date) ?? [];
      existing.push(pct);
      byDate.set(date, existing);
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
}

export const analyticsAgent = new AnalyticsAgent();
