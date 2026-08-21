/**
 * Resource CRUD helpers.
 * Includes 24h TTL cache eviction for OER/SkillsBuild results.
 */

import { findDocs, saveDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Resource, Difficulty } from "@/types/entities";

const DB = DB_NAMES.resources;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedResources(
  subjectId: string,
  topicId: string,
  difficulty: Difficulty,
  schoolId: string
): Promise<Resource[]> {
  const docs = await findDocs<Resource>(DB, {
    type: "resource",
    subjectId,
    topicId,
    difficulty,
    schoolId,
  });

  // Evict stale entries
  const now = Date.now();
  return docs.filter((r) => {
    const age = now - new Date(r.cachedAt).getTime();
    return age < CACHE_TTL_MS;
  });
}

export async function cacheResources(resources: Omit<Resource, "_id" | "_rev">[]): Promise<void> {
  await Promise.all(resources.map((r) => saveDoc(DB, r)));
}
