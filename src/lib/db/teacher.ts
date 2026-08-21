/**
 * Teacher CRUD helpers.
 */

import { findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Teacher } from "@/types/entities";

const DB = DB_NAMES.teachers;

export async function createTeacher(teacher: Omit<Teacher, "_id" | "_rev">): Promise<Teacher> {
  const result = await saveDoc(DB, teacher);
  return { ...teacher, _id: result.id, _rev: result.rev };
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  return getDoc<Teacher>(DB, id);
}

export async function getTeacherByEmail(email: string, schoolId: string): Promise<Teacher | null> {
  const docs = await findDocs<Teacher>(DB, { type: "teacher", email, schoolId });
  return docs[0] ?? null;
}

export async function getTeachersBySchool(schoolId: string): Promise<Teacher[]> {
  return findDocs<Teacher>(DB, { type: "teacher", schoolId });
}
