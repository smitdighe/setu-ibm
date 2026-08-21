/**
 * Class CRUD helpers.
 */

import { findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Class, SkillDistribution } from "@/types/entities";

const DB = DB_NAMES.classes;

export async function createClass(cls: Omit<Class, "_id" | "_rev">): Promise<Class> {
  const result = await saveDoc(DB, cls);
  return { ...cls, _id: result.id, _rev: result.rev };
}

export async function getClassById(id: string): Promise<Class | null> {
  return getDoc<Class>(DB, id);
}

export async function getClassesByTeacher(teacherId: string, schoolId: string): Promise<Class[]> {
  return findDocs<Class>(DB, { type: "class", teacherId, schoolId });
}

export async function getClassesBySchool(schoolId: string): Promise<Class[]> {
  return findDocs<Class>(DB, { type: "class", schoolId });
}

export async function updateSkillDistribution(
  classId: string,
  skillDistribution: SkillDistribution
): Promise<void> {
  const existing = await getDoc<Class>(DB, classId);
  if (!existing) throw new Error(`Class ${classId} not found`);
  await saveDoc(DB, {
    ...existing,
    skillDistribution,
    updatedAt: new Date().toISOString(),
  });
}
