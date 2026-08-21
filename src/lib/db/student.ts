/**
 * Student CRUD helpers.
 * All queries are scoped by schoolId for multi-tenancy.
 */

import { findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Student } from "@/types/entities";

const DB = DB_NAMES.students;

export async function createStudent(student: Omit<Student, "_id" | "_rev">): Promise<Student> {
  const result = await saveDoc(DB, student);
  return { ...student, _id: result.id, _rev: result.rev };
}

export async function getStudentById(id: string): Promise<Student | null> {
  return getDoc<Student>(DB, id);
}

export async function getStudentsByClass(classId: string, schoolId: string): Promise<Student[]> {
  return findDocs<Student>(DB, { type: "student", classId, schoolId });
}

export async function getAtRiskStudents(schoolId: string): Promise<Student[]> {
  return findDocs<Student>(DB, { type: "student", schoolId, riskFlag: true });
}

export async function updateStudentMastery(
  id: string,
  rev: string,
  subjectMastery: Student["subjectMastery"]
): Promise<{ rev: string }> {
  const existing = await getDoc<Student>(DB, id);
  if (!existing) throw new Error(`Student ${id} not found`);
  const result = await saveDoc(DB, {
    ...existing,
    _rev: rev,
    subjectMastery,
  });
  return { rev: result.rev };
}

export async function updateStudentRisk(
  id: string,
  riskScore: number,
  riskFlag: boolean
): Promise<void> {
  const existing = await getDoc<Student>(DB, id);
  if (!existing) throw new Error(`Student ${id} not found`);
  await saveDoc(DB, { ...existing, riskScore, riskFlag });
}

export async function updateStudent(student: Student): Promise<{ rev: string }> {
  const result = await saveDoc(DB, student);
  return { rev: result.rev };
}
