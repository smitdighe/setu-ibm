/**
 * LessonPlanAgent I/O types.
 */

import type { ContentBlock, SkillDistribution } from "@/types/entities";

export type LessonPlanInput = {
  classId: string;
  subjectId: string;
  /** Grade level — included in Granite prompts for age-appropriate content */
  grade: number;
  topicId: string;
  /** ISO date string for the Monday of the target week (e.g. "2024-08-05") */
  weekOf: string;
  /** From AnalyticsAgent — determines how many blocks per level to generate */
  skillDistribution: SkillDistribution;
  /** e.g. "NCERT Grade 6 Chapter 2 — Fractions" */
  curriculumStandard: string;
  schoolId: string;
  /** Language for generated content — "en" (default) or "gu" (Gujarati) */
  lang?: "en" | "gu";
};

export type LessonPlanOutput = {
  lessonPlanId: string;
  contentBlocks: ContentBlock[];
  cosKey: string;
  /** Public-accessible URL (COS endpoint + key) served directly to client */
  printableUrl: string;
  /** true when returned from COS cache without re-generation */
  fromCache: boolean;
};
