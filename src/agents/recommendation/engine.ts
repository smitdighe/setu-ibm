/**
 * engine.ts — mastery-based next-topic selection and resource ranking.
 *
 * Algorithm:
 *   1. Load student's subjectMastery map from Cloudant.
 *   2. Find all topics with mastery < MASTERY_THRESHOLD (80).
 *   3. Sort those topics by curriculum prerequisite order (curriculum.ts).
 *      Topics earlier in the order are prioritised — foundational-first.
 *   4. Take the top MAX_TOPICS (3) topics.
 *   5. For each topic, fetch resources from OER + SkillsBuild.
 *   6. Rank resources: score = topicMatchScore × difficultyMatchScore.
 *   7. Return ranked list, highest score first.
 *
 * ASSUMPTION: curriculum.ts is created in Sub-Task 12. Until then getCurriculumMap()
 * returns {} and topics are sorted by mastery score ascending (weakest first).
 */

import { getStudentById } from "@/lib/db/student";
import { getCurriculumMap } from "@/agents/orchestrator/context";
import { fetchOerResources } from "./connectors/oer";
import { fetchSkillsBuildResources } from "./connectors/skillsbuild";
import type { RankedResource } from "./types";
import type { Difficulty, LearningPace } from "@/types/entities";

const MASTERY_THRESHOLD = 80;
const MAX_TOPICS = 3;

/** Map a student's learning pace to the difficulty level to target */
const PACE_TO_DIFFICULTY: Record<LearningPace, Difficulty> = {
  slow: "easy",
  average: "medium",
  fast: "hard",
};

type TopicScore = { topicId: string; mastery: number };

/**
 * Select the top next-best topics for a student in a subject.
 * Uses curriculum prerequisite order when available.
 */
async function selectNextTopics(
  studentId: string,
  subjectId: string
): Promise<TopicScore[]> {
  const student = await getStudentById(studentId);
  if (!student) return [];

  const masteryMap = student.subjectMastery[subjectId] ?? {};
  const curriculumMap = await getCurriculumMap();
  const orderedTopics: string[] = curriculumMap[subjectId] ?? [];

  // All topics below threshold
  const weakTopics: TopicScore[] = Object.entries(masteryMap)
    .filter(([, score]) => score < MASTERY_THRESHOLD)
    .map(([topicId, mastery]) => ({ topicId, mastery }));

  if (weakTopics.length === 0) {
    // Student has mastered everything tracked — pick the last curriculum topic
    // (most advanced) as an enrichment suggestion
    const lastTopic = orderedTopics[orderedTopics.length - 1];
    if (lastTopic) return [{ topicId: lastTopic, mastery: 100 }];
    return [];
  }

  if (orderedTopics.length > 0) {
    // Sort by position in curriculum (prerequisite order)
    weakTopics.sort((a, b) => {
      const ia = orderedTopics.indexOf(a.topicId);
      const ib = orderedTopics.indexOf(b.topicId);
      // Topics not in curriculum map go to end
      const posA = ia === -1 ? 999 : ia;
      const posB = ib === -1 ? 999 : ib;
      return posA - posB;
    });
  } else {
    // No curriculum order — sort by mastery ascending (weakest first)
    weakTopics.sort((a, b) => a.mastery - b.mastery);
  }

  return weakTopics.slice(0, MAX_TOPICS);
}

/**
 * Score a resource against the student's target difficulty level.
 * Returns 0–1.
 */
function scoreDifficultyMatch(
  resourceDifficulty: Difficulty,
  targetDifficulty: Difficulty
): number {
  if (resourceDifficulty === targetDifficulty) return 1.0;
  const order: Difficulty[] = ["easy", "medium", "hard"];
  const dist = Math.abs(order.indexOf(resourceDifficulty) - order.indexOf(targetDifficulty));
  return dist === 1 ? 0.5 : 0.1;
}

/**
 * Fetch and rank resources for a student across their top weak topics.
 */
export async function buildRecommendations(
  studentId: string,
  subjectId: string,
  grade: number,
  schoolId: string
): Promise<RankedResource[]> {
  const student = await getStudentById(studentId);
  if (!student) return [];

  const targetDifficulty = PACE_TO_DIFFICULTY[student.learningPace];
  const nextTopics = await selectNextTopics(studentId, subjectId);

  if (nextTopics.length === 0) return [];

  const allResources: RankedResource[] = [];

  await Promise.all(
    nextTopics.map(async ({ topicId, mastery }) => {
      // Fetch from both sources in parallel
      const [oerResults, sbResults] = await Promise.all([
        fetchOerResources(subjectId, topicId, targetDifficulty, grade, schoolId),
        Promise.resolve(fetchSkillsBuildResources(subjectId, topicId, targetDifficulty, schoolId)),
      ]);

      const combined = [...oerResults, ...sbResults];

      for (const resource of combined) {
        const diffScore = scoreDifficultyMatch(resource.difficulty, targetDifficulty);
        // Topic is always a match (we fetched for this topic) — weight it 0.6
        // Difficulty match contributes 0.4
        const score = 0.6 + 0.4 * diffScore;
        const masteryLabel = mastery < 40 ? "beginner" : mastery < 70 ? "developing" : "almost there";
        const reason = `Recommended for ${topicId} — your current mastery is ${mastery}/100 (${masteryLabel}). This ${resource.difficulty} resource matches your learning pace.`;

        allResources.push({ ...resource, score, reason });
      }
    })
  );

  // Sort highest score first, deduplicate by URL
  const seen = new Set<string>();
  return allResources
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });
}
