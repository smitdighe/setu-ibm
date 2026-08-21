/**
 * BobAgent — the contract every domain agent must satisfy.
 * Each agent is a TypeScript class implementing this interface,
 * registered with the OrchestratorAgent at startup.
 */

export type AgentTool = {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (...args: any[]) => Promise<unknown>;
};

export interface BobAgent<TInput, TOutput> {
  /** Unique machine-readable name, e.g. "analytics", "lessonPlan" */
  readonly name: string;
  /** Human-readable description shown in logs and orchestrator context */
  readonly description: string;
  /** Typed tool/function bindings this agent exposes to the orchestrator */
  readonly tools: AgentTool[];
  /** Primary entry point — the orchestrator always calls this */
  run(input: TInput): Promise<TOutput>;
}

/**
 * Intent enum — the orchestrator router maps these to the correct agent.
 * The Teacher Assistant agent resolves natural-language queries to one of these.
 */
export type AgentIntent =
  | "recommend"        // LearningRecommendationAgent
  | "generate_lesson"  // LessonPlanAgent
  | "analytics"        // AnalyticsAgent
  | "assess"           // AssessmentAgent
  | "teacher_query";   // TeacherAssistantAgent

export type UserRole = "teacher" | "admin" | "student";

/** Shared context object passed through every orchestrator call */
export type OrchestratorContext = {
  intent: AgentIntent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  schoolId: string;
  userId: string;
  role: UserRole;
};

/** Generic orchestrator output wrapper */
export type OrchestratorResult<T = unknown> = {
  success: boolean;
  intent: AgentIntent;
  data?: T;
  error?: string;
};
