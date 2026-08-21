/**
 * Assessment CRUD helpers.
 */

import { findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Assessment, StudentResponse, FeedbackStatus } from "@/types/entities";

const DB = DB_NAMES.assessments;

export async function createAssessment(assessment: Omit<Assessment, "_id" | "_rev">): Promise<Assessment> {
  const result = await saveDoc(DB, assessment);
  return { ...assessment, _id: result.id, _rev: result.rev };
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  return getDoc<Assessment>(DB, id);
}

export async function getAssessmentsByClass(classId: string, schoolId: string): Promise<Assessment[]> {
  return findDocs<Assessment>(DB, { type: "assessment", classId, schoolId });
}

export async function getAssessmentsByTopic(
  topicId: string,
  classId: string,
  schoolId: string
): Promise<Assessment[]> {
  return findDocs<Assessment>(DB, { type: "assessment", topicId, classId, schoolId });
}

/** Add student responses to an existing assessment */
export async function saveStudentResponses(
  assessmentId: string,
  responses: StudentResponse[]
): Promise<void> {
  const assessment = await getDoc<Assessment>(DB, assessmentId);
  if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);
  await saveDoc(DB, {
    ...assessment,
    studentResponses: [...assessment.studentResponses, ...responses],
    status: "graded",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update feedback status for a student's response — audit trail approval flow.
 * Teacher calls PATCH /api/assessments/:id/approve
 */
export async function updateFeedbackStatus(
  assessmentId: string,
  studentId: string,
  status: FeedbackStatus
): Promise<void> {
  const assessment = await getDoc<Assessment>(DB, assessmentId);
  if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);

  const updatedResponses = assessment.studentResponses.map((r) =>
    r.studentId === studentId ? { ...r, feedbackStatus: status } : r
  );

  await saveDoc(DB, {
    ...assessment,
    studentResponses: updatedResponses,
    updatedAt: new Date().toISOString(),
  });
}

/** Get all assessments with pending_review feedback (for teacher dashboard) */
export async function getPendingReviewAssessments(schoolId: string): Promise<Assessment[]> {
  const all = await findDocs<Assessment>(DB, { type: "assessment", schoolId, status: "graded" });
  return all.filter((a) =>
    a.studentResponses.some((r) => r.feedbackStatus === "pending_review")
  );
}
