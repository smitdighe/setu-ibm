/**
 * risk.ts — composite risk score computation.
 *
 * Formula (from plan):
 *   riskScore = 0.4 * mastery_decline + 0.3 * missed_assessments_rate + 0.3 * pace_lag
 *
 * Each component is normalised to [0, 1]:
 *   mastery_decline     — fraction of topics with "declining" trend
 *   missed_assessments  — fraction of class assessments the student has no response for
 *   pace_lag            — encoded from Student.learningPace ("slow"=1, "average"=0.5, "fast"=0)
 *
 * ASSUMPTION: riskFlag is set when riskScore > threshold (default 0.7, see triggers.ts).
 */

import { getAssessmentsByClass } from "@/lib/db/assessment";
import type { TopicMastery } from "./types";
import type { LearningPace } from "@/types/entities";

const PACE_WEIGHTS: Record<LearningPace, number> = {
  slow: 1.0,
  average: 0.5,
  fast: 0.0,
};

export type RiskInput = {
  studentId: string;
  classId: string;
  schoolId: string;
  masteryByTopic: TopicMastery[];
  learningPace: LearningPace;
};

export type RiskResult = {
  riskScore: number;  // 0–1
  riskFlag: boolean;
  breakdown: {
    masteryDeclineComponent: number;
    missedAssessmentsComponent: number;
    paceLagComponent: number;
  };
};

const RISK_THRESHOLD = parseFloat(process.env.RISK_FLAG_THRESHOLD ?? "0.7");

export async function computeRiskScore(input: RiskInput): Promise<RiskResult> {
  const { studentId, classId, schoolId, masteryByTopic, learningPace } = input;

  // 1. Mastery decline component — fraction of topics trending downward
  const masteryDecline =
    masteryByTopic.length === 0
      ? 0
      : masteryByTopic.filter((t) => t.trend === "declining").length /
        masteryByTopic.length;

  // 2. Missed assessments component
  const allAssessments = await getAssessmentsByClass(classId, schoolId);
  const gradedAssessments = allAssessments.filter((a) => a.status === "graded");
  const missed =
    gradedAssessments.length === 0
      ? 0
      : gradedAssessments.filter(
          (a) => !a.studentResponses.some((r) => r.studentId === studentId)
        ).length / gradedAssessments.length;

  // 3. Pace lag component
  const paceLag = PACE_WEIGHTS[learningPace];

  // Weighted composite
  const riskScore =
    0.4 * masteryDecline + 0.3 * missed + 0.3 * paceLag;

  return {
    riskScore: Math.min(1, Math.max(0, riskScore)),
    riskFlag: riskScore > RISK_THRESHOLD,
    breakdown: {
      masteryDeclineComponent: masteryDecline,
      missedAssessmentsComponent: missed,
      paceLagComponent: paceLag,
    },
  };
}
