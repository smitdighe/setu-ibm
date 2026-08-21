/**
 * skillsbuild.ts — IBM SkillsBuild content connector (STUB).
 *
 * ASSUMPTION: IBM SkillsBuild does not have a public content search API at the
 * time of this build. This stub returns realistic-looking resources so the
 * recommendation pipeline works end-to-end with seed data.
 *
 * To wire up the real API:
 *   1. Obtain IBM SkillsBuild API credentials from your IBM account team.
 *   2. Set env vars: SKILLSBUILD_API_KEY, SKILLSBUILD_API_URL.
 *   3. Replace the stub body below with a real HTTP fetch matching the
 *      OER connector pattern (cache → fetch → persist).
 */

import type { Resource, Difficulty } from "@/types/entities";

// Stub resource bank — realistic titles and IBM SkillsBuild URL structure
const STUB_RESOURCES: Record<string, Omit<Resource, "_id" | "_rev" | "schoolId" | "topicId" | "cachedAt">[]> = {
  math: [
    {
      type: "resource",
      source: "skillsbuild",
      subjectId: "math",
      difficulty: "easy",
      title: "Introduction to Numbers — IBM SkillsBuild",
      description: "A beginner-friendly module covering number systems and basic operations.",
      url: "https://skills.yourlearning.ibm.com/activity/ILB-MATHS-INTRO",
    },
    {
      type: "resource",
      source: "skillsbuild",
      subjectId: "math",
      difficulty: "medium",
      title: "Fractions and Decimals — IBM SkillsBuild",
      description: "Intermediate module on fractions, decimals, and their real-world applications.",
      url: "https://skills.yourlearning.ibm.com/activity/ILB-MATHS-FRACTIONS",
    },
    {
      type: "resource",
      source: "skillsbuild",
      subjectId: "math",
      difficulty: "hard",
      title: "Algebraic Thinking — IBM SkillsBuild",
      description: "Advanced module introducing algebraic concepts for Grade 6–8 learners.",
      url: "https://skills.yourlearning.ibm.com/activity/ILB-MATHS-ALGEBRA",
    },
  ],
  science: [
    {
      type: "resource",
      source: "skillsbuild",
      subjectId: "science",
      difficulty: "easy",
      title: "Living World — IBM SkillsBuild",
      description: "Introduction to living organisms, their characteristics, and classification.",
      url: "https://skills.yourlearning.ibm.com/activity/ILB-SCI-LIVING",
    },
    {
      type: "resource",
      source: "skillsbuild",
      subjectId: "science",
      difficulty: "medium",
      title: "Matter and Materials — IBM SkillsBuild",
      description: "Explore states of matter, properties of materials, and changes in matter.",
      url: "https://skills.yourlearning.ibm.com/activity/ILB-SCI-MATTER",
    },
    {
      type: "resource",
      source: "skillsbuild",
      subjectId: "science",
      difficulty: "hard",
      title: "Forces and Motion — IBM SkillsBuild",
      description: "Advanced concepts on force, motion, and energy for upper-primary learners.",
      url: "https://skills.yourlearning.ibm.com/activity/ILB-SCI-FORCES",
    },
  ],
};

/** Fallback stub resources used when subjectId has no specific entries */
const FALLBACK_STUB: Omit<Resource, "_id" | "_rev" | "schoolId" | "topicId" | "cachedAt">[] = [
  {
    type: "resource",
    source: "skillsbuild",
    subjectId: "general",
    difficulty: "easy",
    title: "Study Skills for Students — IBM SkillsBuild",
    description: "Tips and strategies to help students learn more effectively.",
    url: "https://skills.yourlearning.ibm.com/activity/ILB-STUDY-SKILLS",
  },
];

/**
 * Return 1–3 stub SkillsBuild resources for the given topic/difficulty.
 * Filters by difficulty match; falls back to any difficulty if no match.
 */
export function fetchSkillsBuildResources(
  subjectId: string,
  topicId: string,
  difficulty: Difficulty,
  schoolId: string
): Resource[] {
  const pool = STUB_RESOURCES[subjectId.toLowerCase()] ?? FALLBACK_STUB;
  const now = new Date().toISOString();

  // Prefer exact difficulty match; fall back to any
  let candidates = pool.filter((r) => r.difficulty === difficulty);
  if (candidates.length === 0) candidates = pool;

  return candidates.slice(0, 2).map((r, i) => ({
    ...r,
    _id: `stub_sb_${subjectId}_${topicId}_${i}`,
    schoolId,
    topicId,
    cachedAt: now,
  })) as Resource[];
}
