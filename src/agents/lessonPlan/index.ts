/**
 * LessonPlanAgent — generates differentiated weekly lesson plans via Granite LLM,
 * caches them in IBM COS, and persists metadata to Cloudant.
 *
 * Cache-first flow:
 *   1. Build COS key from (schoolId, classId, subjectId, weekOf).
 *   2. If COS object exists → deserialise and return immediately (no LLM call).
 *   3. Otherwise generate → format → upload to COS → save to Cloudant → return.
 *
 * The three content levels (remedial / on_track / advanced) are generated in
 * parallel via Granite LLM. The proportion of each level is noted from
 * skillDistribution but all three are always generated — the teacher and the
 * student view filter by the student's actual level at display time.
 */

import type { BobAgent, AgentTool } from "@/types/agents";
import type { LessonPlanInput, LessonPlanOutput } from "./types";
import { buildCosKey, loadFromCache, storePlan, buildPrintableUrl } from "./cache";
import { generateAllLevels } from "./generator";
import { formatToPrintableHtml } from "./formatter";
import { createLessonPlan } from "@/lib/db/lessonPlan";

export class LessonPlanAgent implements BobAgent<LessonPlanInput, LessonPlanOutput> {
  readonly name = "lessonPlan";
  readonly description =
    "Generates differentiated (remedial/on-track/advanced) weekly lesson plans via Granite LLM with COS cache-first strategy.";
  readonly tools: AgentTool[] = [];

  async run(input: LessonPlanInput): Promise<LessonPlanOutput> {
    const {
      classId, subjectId, grade, topicId,
      weekOf, skillDistribution, curriculumStandard, schoolId, lang,
    } = input;

    const cosKey = buildCosKey(schoolId, classId, subjectId, weekOf);

    // ── Step 1: Cache check ────────────────────────────────────────────────────
    const cached = await loadFromCache(cosKey);
    if (cached) {
      // Fetch the Cloudant document id for the cached plan so we can return it.
      // ASSUMPTION: if COS has the plan the Cloudant doc was already saved;
      // we return a synthetic id from the cosKey to avoid a second DB lookup.
      return {
        lessonPlanId: cosKey,
        contentBlocks: cached.contentBlocks,
        cosKey,
        printableUrl: buildPrintableUrl(cosKey),
        fromCache: true,
      };
    }

    // ── Step 2: Generate all three levels in parallel via Granite ─────────────
    const contentBlocks = await generateAllLevels({
      topicId,
      subjectId,
      grade,
      curriculumStandard,
      lang,
    });

    // ── Step 3: Format to printable HTML ──────────────────────────────────────
    const printableHtml = formatToPrintableHtml(
      { subjectId, topicId, weekOf, curriculumStandard },
      contentBlocks
    );

    // ── Step 4: Upload to COS ─────────────────────────────────────────────────
    const planPayload = {
      contentBlocks,
      printableHtml,
      generatedAt: new Date().toISOString(),
    };
    await storePlan(cosKey, planPayload);

    // ── Step 5: Persist metadata to Cloudant ──────────────────────────────────
    const now = new Date().toISOString();
    const saved = await createLessonPlan({
      type: "lessonPlan",
      schoolId,
      classId,
      subjectId,
      topicId,
      weekOf,
      curriculumStandard,
      contentBlocks,
      cosKey,
      printableHtml,
      status: "draft",
      createdAt: now,
    });

    // Log skill distribution proportions for teacher awareness (not stored)
    console.log(
      `[LessonPlan] Generated for class ${classId} week ${weekOf}. ` +
      `Distribution — remedial: ${skillDistribution.remedial}, ` +
      `onTrack: ${skillDistribution.onTrack}, advanced: ${skillDistribution.advanced}`
    );

    return {
      lessonPlanId: saved._id!,
      contentBlocks,
      cosKey,
      printableUrl: buildPrintableUrl(cosKey),
      fromCache: false,
    };
  }
}

export const lessonPlanAgent = new LessonPlanAgent();
