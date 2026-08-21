/**
 * cohort.ts — class-level skill distribution summary.
 *
 * Buckets: 0–60 = remedial, 61–80 = on-track, 81–100 = advanced.
 * Computes the average mastery score across all topics for each student,
 * then counts how many students fall in each bucket.
 *
 * Output feeds the Teacher Dashboard and the LessonPlanAgent.
 */

import type { SkillDistribution } from "@/types/entities";

export type StudentAvgMastery = {
  studentId: string;
  avgScore: number;   // 0–100 average across all topics
};

/**
 * Aggregate a list of per-student average scores into skill distribution buckets.
 * Pass in the pre-computed averages so this function stays pure and testable.
 */
export function computeSkillDistribution(
  studentAverages: StudentAvgMastery[]
): SkillDistribution {
  const distribution: SkillDistribution = { remedial: 0, onTrack: 0, advanced: 0 };

  for (const { avgScore } of studentAverages) {
    if (avgScore <= 60) distribution.remedial++;
    else if (avgScore <= 80) distribution.onTrack++;
    else distribution.advanced++;
  }

  return distribution;
}

/**
 * Compute the average mastery score for a single student across a set of topics.
 * Returns 0 if no topic scores are available (treated as remedial).
 */
export function computeStudentAverage(
  studentId: string,
  topicScores: { topicId: string; score: number }[]
): StudentAvgMastery {
  if (topicScores.length === 0) return { studentId, avgScore: 0 };
  const sum = topicScores.reduce((acc, t) => acc + t.score, 0);
  return { studentId, avgScore: Math.round(sum / topicScores.length) };
}
