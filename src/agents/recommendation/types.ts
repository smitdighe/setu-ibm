/**
 * RecommendationAgent I/O types.
 */

import type { Resource } from "@/types/entities";

export type RecommendationInput = {
  studentId: string;
  subjectId: string;
  schoolId: string;
};

export type RankedResource = Resource & {
  /** 0–1 relevance score: topic match × difficulty match to student's level */
  score: number;
  /** Human-readable reason shown in the student recommendation feed */
  reason: string;
};

export type RecommendationOutput = {
  studentId: string;
  subjectId: string;
  /** Ranked highest-score first */
  recommendations: RankedResource[];
};
