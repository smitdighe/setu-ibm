/**
 * AnalyticsAgent I/O types.
 * Defined here in Sub-Task 3 so the orchestrator trigger can import them
 * before AnalyticsAgent itself is implemented in Sub-Task 4.
 *
 * Full implementation lives in src/agents/analytics/index.ts (Sub-Task 4).
 */

import type { SkillDistribution } from "@/types/entities";

export type AnalyticsInput = {
  /** If provided, compute student-level analytics only */
  studentId?: string;
  /** Required — all analytics are scoped to a class */
  classId: string;
  subjectId: string;
  schoolId: string;
};

export type TopicMastery = {
  topicId: string;
  score: number;        // 0–100
  trend: "improving" | "declining" | "stable";
};

export type AnalyticsOutput = {
  /** Populated when studentId is provided */
  studentId?: string;
  masteryByTopic: TopicMastery[];
  /** Rolling average mastery over the last N assessments */
  trendData: { date: string; avgScore: number }[];
  riskScore: number;     // 0–1
  riskFlag: boolean;
  /** Class-level bucket counts */
  skillDistribution: SkillDistribution;
};
