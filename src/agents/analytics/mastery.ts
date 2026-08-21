/**
 * mastery.ts — per-topic mastery score computation.
 *
 * Algorithm: rolling weighted average over the student's assessment responses
 * for a given topic. More recent assessments are weighted more heavily using
 * an exponential decay: weight[i] = DECAY^(n-1-i) where i=0 is oldest.
 *
 * ASSUMPTION: DECAY = 0.8. A student's last assessment accounts for ~44% of
 * their mastery score when they have 3 assessments on the same topic.
 */

import { getAssessmentsByTopic } from "@/lib/db/assessment";
import type { TopicMastery } from "./types";

const DECAY = 0.8;

/**
 * Compute mastery score (0–100) and trend for a student on a given topic.
 * Returns null if the student has no assessments for this topic.
 */
export async function computeTopicMastery(
  studentId: string,
  topicId: string,
  subjectId: string,
  classId: string,
  schoolId: string
): Promise<TopicMastery | null> {
  const assessments = await getAssessmentsByTopic(topicId, classId, schoolId);

  // Filter to responses from this student, sorted oldest → newest
  type ScoredResponse = { scorePercent: number; date: string };
  const scores: ScoredResponse[] = assessments
    .flatMap((a) =>
      a.studentResponses
        .filter((r) => r.studentId === studentId && r.maxScore > 0)
        .map((r) => ({
          scorePercent: (r.score / r.maxScore) * 100,
          date: r.gradedAt,
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (scores.length === 0) return null;

  // Exponential decay weighted average
  const n = scores.length;
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < n; i++) {
    const weight = Math.pow(DECAY, n - 1 - i);
    weightedSum += scores[i].scorePercent * weight;
    weightTotal += weight;
  }
  const masteryScore = Math.min(100, Math.max(0, weightedSum / weightTotal));

  // Trend: compare last score vs second-to-last
  let trend: TopicMastery["trend"] = "stable";
  if (n >= 2) {
    const delta = scores[n - 1].scorePercent - scores[n - 2].scorePercent;
    if (delta > 5) trend = "improving";
    else if (delta < -5) trend = "declining";
  }

  return { topicId, score: Math.round(masteryScore), trend };
}

/**
 * Compute mastery for all topics a student has been assessed on for a subject.
 * Returns the list sorted by mastery score ascending (weakest first).
 */
export async function computeAllTopicMastery(
  studentId: string,
  subjectId: string,
  classId: string,
  schoolId: string,
  topicIds: string[]
): Promise<TopicMastery[]> {
  const results = await Promise.all(
    topicIds.map((topicId) =>
      computeTopicMastery(studentId, topicId, subjectId, classId, schoolId)
    )
  );
  return results
    .filter((r): r is TopicMastery => r !== null)
    .sort((a, b) => a.score - b.score);
}
