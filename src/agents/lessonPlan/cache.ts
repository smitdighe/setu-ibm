/**
 * cache.ts — COS-backed cache for lesson plan documents.
 *
 * Cache key: `{schoolId}/{classId}/{subjectId}/{weekOf}.json`
 * Strategy: check COS first; if object exists deserialise and return it.
 *           If not, caller generates the plan and uploads it via storePlan().
 *
 * Low-bandwidth rationale: once a plan is in COS the client receives a direct
 * URL and fetches it from object storage — no repeated LLM calls or server hops.
 */

import { upload, download, exists, LESSON_BUCKET } from "@/lib/ibm/cos";
import type { ContentBlock } from "@/types/entities";

export type CachedPlan = {
  contentBlocks: ContentBlock[];
  printableHtml: string;
  generatedAt: string;
};

/**
 * Build the canonical COS object key for a lesson plan.
 */
export function buildCosKey(
  schoolId: string,
  classId: string,
  subjectId: string,
  weekOf: string
): string {
  // Sanitise segments — forward-slash is the COS "folder" delimiter
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safe(schoolId)}/${safe(classId)}/${safe(subjectId)}/${safe(weekOf)}.json`;
}

/**
 * Try to load an existing plan from COS.
 * Returns null on cache miss (object not found).
 */
export async function loadFromCache(cosKey: string): Promise<CachedPlan | null> {
  if (!(await exists(cosKey))) return null;
  const raw = await download(cosKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedPlan;
  } catch {
    // Corrupt object — treat as miss
    return null;
  }
}

/**
 * Upload a generated plan to COS.
 * Returns the cosKey on success.
 */
export async function storePlan(cosKey: string, plan: CachedPlan): Promise<string> {
  await upload(cosKey, JSON.stringify(plan), "application/json");
  return cosKey;
}

/**
 * Build a direct-access URL for a COS object.
 * Clients use this URL to fetch the lesson plan directly from COS — no
 * server round-trip needed after the first generation.
 */
export function buildPrintableUrl(cosKey: string): string {
  const endpoint = process.env.COS_ENDPOINT ?? "https://s3.us-south.cloud-object-storage.appdomain.cloud";
  return `${endpoint}/${LESSON_BUCKET}/${cosKey}`;
}
