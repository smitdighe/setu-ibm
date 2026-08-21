/**
 * TeacherAssistantAgent I/O types.
 */

export type TeacherQueryInput = {
  message: string;
  sessionId: string;
  classId: string;
  schoolId: string;
  userId: string;
  /** Language for AI-generated replies — "en" (default) or "gu" (Gujarati) */
  lang?: "en" | "gu";
};

export type ActionButton = {
  label: string;
  intent: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
};

export type TeacherQueryOutput = {
  reply: string;
  actionButtons?: ActionButton[];
  data?: unknown;
};

/** Intents the teacher assistant can classify into */
export type TeacherIntent =
  | "get_at_risk"
  | "generate_worksheet"
  | "generate_lesson"
  | "get_progress"
  | "generate_quiz"
  | "unknown";

export type ExtractedEntities = {
  intent: TeacherIntent;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  confidence: "high" | "low";
};

export type ConversationTurn = {
  role: "teacher" | "assistant";
  content: string;
  timestamp: string;
};
