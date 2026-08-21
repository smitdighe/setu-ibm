/**
 * LearningRecommendationAgent — personalised resource recommendations per student.
 *
 * Uses mastery-based next-topic selection (engine.ts) to find the student's
 * weakest topics in prerequisite order, then fetches resources from OER Commons
 * (live HTTP, 24h Cloudant cache) and IBM SkillsBuild (stub).
 *
 * grade is resolved from the student's Class document.
 * ASSUMPTION: A student belongs to exactly one class; grade is read from that class.
 */

import type { BobAgent, AgentTool } from "@/types/agents";
import type { RecommendationInput, RecommendationOutput } from "./types";
import { buildRecommendations } from "./engine";
import { getClassById } from "@/lib/db/class";
import { getStudentById } from "@/lib/db/student";

export class LearningRecommendationAgent implements BobAgent<RecommendationInput, RecommendationOutput> {
  readonly name = "recommendation";
  readonly description =
    "Recommends next-best learning resources per student using mastery-based topic selection, OER Commons, and IBM SkillsBuild.";
  readonly tools: AgentTool[] = [];

  async run(input: RecommendationInput): Promise<RecommendationOutput> {
    const { studentId, subjectId, schoolId } = input;

    const student = await getStudentById(studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    // Resolve grade from the student's class
    const cls = await getClassById(student.classId);
    const grade = cls?.grade ?? 6; // ASSUMPTION: default grade 6 if class not found

    const recommendations = await buildRecommendations(
      studentId,
      subjectId,
      grade,
      schoolId
    );

    return { studentId, subjectId, recommendations };
  }
}

export const recommendationAgent = new LearningRecommendationAgent();
