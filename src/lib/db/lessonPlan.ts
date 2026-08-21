/**
 * LessonPlan CRUD helpers.
 */

import { findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { LessonPlan } from "@/types/entities";

const DB = DB_NAMES.lessonPlans;

export async function createLessonPlan(plan: Omit<LessonPlan, "_id" | "_rev">): Promise<LessonPlan> {
  const result = await saveDoc(DB, plan);
  return { ...plan, _id: result.id, _rev: result.rev };
}

export async function getLessonPlanById(id: string): Promise<LessonPlan | null> {
  return getDoc<LessonPlan>(DB, id);
}

/** Primary lookup — used by cache-first strategy in LessonPlanAgent */
export async function getLessonPlan(
  classId: string,
  subjectId: string,
  weekOf: string,
  schoolId: string
): Promise<LessonPlan | null> {
  const docs = await findDocs<LessonPlan>(DB, {
    type: "lessonPlan",
    classId,
    subjectId,
    weekOf,
    schoolId,
  });
  return docs[0] ?? null;
}

export async function getLessonPlansByClass(classId: string, schoolId: string): Promise<LessonPlan[]> {
  return findDocs<LessonPlan>(DB, { type: "lessonPlan", classId, schoolId });
}

export async function publishLessonPlan(id: string): Promise<void> {
  const plan = await getDoc<LessonPlan>(DB, id);
  if (!plan) throw new Error(`LessonPlan ${id} not found`);
  await saveDoc(DB, { ...plan, status: "published" });
}
