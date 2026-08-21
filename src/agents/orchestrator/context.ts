/**
 * Shared context store for the OrchestratorAgent.
 *
 * Holds two in-memory caches backed by Cloudant:
 *   1. Student profile cache — TTL 5 min, keyed by studentId
 *   2. Curriculum map cache — TTL 5 min, loaded from src/data/curriculum.ts
 *      (static file; Cloudant-backed load is future work once seed data exists)
 *
 * ASSUMPTION: In-process memory cache is acceptable for Code Engine deployments
 * where a single container serves a school. For multi-instance deployments,
 * replace with Redis or IBM Memcached. Cache is keyed per-process.
 */

import { getStudentById } from "@/lib/db/student";
import type { Student } from "@/types/entities";
import type { CurriculumMap } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

type CacheEntry<T> = {
  value: T;
  expiresAt: number; // Date.now() ms timestamp
};

// ── Cache stores ──────────────────────────────────────────────────────────────

const STUDENT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CURRICULUM_TTL_MS = 5 * 60 * 1000;

const studentCache = new Map<string, CacheEntry<Student>>();
let curriculumCache: CacheEntry<CurriculumMap> | null = null;

// ── Student profile cache ─────────────────────────────────────────────────────

/**
 * Get a student profile, using the in-memory cache when fresh.
 * Falls through to Cloudant on cache miss or expiry.
 */
export async function getCachedStudent(studentId: string): Promise<Student | null> {
  const entry = studentCache.get(studentId);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }
  const student = await getStudentById(studentId);
  if (student) {
    studentCache.set(studentId, {
      value: student,
      expiresAt: Date.now() + STUDENT_TTL_MS,
    });
  }
  return student;
}

/**
 * Explicitly invalidate a student's cache entry.
 * Called by the orchestrator after any agent mutates student data.
 */
export function invalidateStudent(studentId: string): void {
  studentCache.delete(studentId);
}

/**
 * Bulk-invalidate all students in a class.
 * Called after an assessment cycle completes for the whole class.
 */
export function invalidateClass(classStudentIds: string[]): void {
  for (const id of classStudentIds) {
    studentCache.delete(id);
  }
}

// ── Curriculum map cache ──────────────────────────────────────────────────────

/**
 * Get the curriculum map, loading from the static data file on first call.
 * The map is a static JSON file (src/data/curriculum.ts) — no Cloudant needed.
 *
 * ASSUMPTION: curriculum.ts is created in Sub-Task 12 (seed data).
 * Returns an empty map until then — agents that need it will get no-op results.
 */
export async function getCurriculumMap(): Promise<CurriculumMap> {
  if (curriculumCache && curriculumCache.expiresAt > Date.now()) {
    return curriculumCache.value;
  }

  let map: CurriculumMap = {};
  try {
    // Dynamic import so Next.js doesn't bundle this at build time.
    // The path is resolved at runtime; TypeScript can't verify it until
    // src/data/curriculum.ts is created in Sub-Task 12 — hence the cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import("../../data/curriculum" as any);
    map = (mod as { curriculumMap: CurriculumMap }).curriculumMap ?? {};
  } catch {
    // Sub-Task 12 not yet completed — return empty map
    map = {};
  }

  curriculumCache = { value: map, expiresAt: Date.now() + CURRICULUM_TTL_MS };
  return map;
}

/** Force-refresh the curriculum map cache (e.g. after a curriculum update). */
export function invalidateCurriculumCache(): void {
  curriculumCache = null;
}
