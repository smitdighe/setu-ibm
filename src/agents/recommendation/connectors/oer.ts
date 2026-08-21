/**
 * oer.ts — OER Commons HTTP connector.
 *
 * Fetches learning resources from the OER Commons public API (no auth required).
 * Results are cached in Cloudant `resources` DB with a 24h TTL to reduce
 * external HTTP calls on slow/intermittent rural school connections.
 *
 * API docs: https://www.oercommons.org/api/v1/ (public, no key needed)
 * ASSUMPTION: OER Commons API v1 is stable; response shape may change.
 * If the API is unreachable the connector returns [] silently (fail-open).
 */

import { getCachedResources, cacheResources } from "@/lib/db/resource";
import type { Resource, Difficulty } from "@/types/entities";

const OER_BASE = "https://www.oercommons.org/api/v1";
// Fetch timeout — important on slow rural connections
const FETCH_TIMEOUT_MS = 8_000;

type OerMaterial = {
  id: string;
  title: string;
  description?: string;
  url?: string;
  canonical_url?: string;
};

type OerResponse = {
  results?: OerMaterial[];
};

/**
 * Fetch resources for a given topic from OER Commons.
 * Returns cached results when fresh; hits the API otherwise.
 */
export async function fetchOerResources(
  subjectId: string,
  topicId: string,
  difficulty: Difficulty,
  grade: number,
  schoolId: string
): Promise<Resource[]> {
  // 1. Check 24h Cloudant cache first
  const cached = await getCachedResources(subjectId, topicId, difficulty, schoolId);
  if (cached.length > 0) return cached;

  // 2. Fetch from OER Commons
  const params = new URLSearchParams({
    subject: subjectId,
    search: topicId,
    grade_levels: String(grade),
    limit: "5",
  });

  let materials: OerMaterial[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${OER_BASE}/materials/?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as OerResponse;
      materials = data.results ?? [];
    }
  } catch {
    // Network failure or timeout — return empty, caller falls back to SkillsBuild stub
    return [];
  }

  // 3. Map to Resource type
  const now = new Date().toISOString();
  const resources: Omit<Resource, "_id" | "_rev">[] = materials
    .filter((m) => m.url || m.canonical_url)
    .slice(0, 5)
    .map((m, i) => ({
      type: "resource" as const,
      schoolId,
      source: "oer" as const,
      subjectId,
      topicId,
      difficulty,
      title: m.title ?? `OER Resource ${i + 1}`,
      description: m.description ?? "",
      url: (m.canonical_url ?? m.url)!,
      cachedAt: now,
    }));

  // 4. Persist to Cloudant cache
  if (resources.length > 0) {
    await cacheResources(resources);
  }

  return resources as Resource[];
}
