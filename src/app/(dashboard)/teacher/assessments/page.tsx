/**
 * Teacher — Assessments page.
 *
 * Two modes:
 *  1. Load Existing — fetch assessments by Class ID, review pending feedback.
 *  2. Generate New  — generate a fresh assessment via Granite, view questions
 *                     inline, then reload the list to begin the approval flow.
 *
 * UX mirrors the Lesson Plans page pattern (two buttons, shared field set).
 */
"use client";

import { useState, useCallback } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";
import type { Question } from "@/types/entities";

// ── Local types ───────────────────────────────────────────────────────────────

type StudentResponse = {
  studentId: string;
  score: number;
  maxScore: number;
  feedbackText: string;
  feedbackStatus: string;
  gradedAt: string;
};

type Assessment = {
  _id: string;
  topicId: string;
  subjectId: string;
  difficulty: string;
  status: string;
  questions: Question[];
  studentResponses: StudentResponse[];
};

type GeneratedAssessment = {
  assessmentId: string;
  questions: Question[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssessmentsPage() {
  // Shared fields (used by both Load and Generate)
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("math");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Generate-specific fields
  const [questionCount, setQuestionCount] = useState(8);
  const [questionType, setQuestionType] = useState<"mcq" | "short_answer" | "mixed">("mixed");

  // UI state
  const [mode, setMode] = useState<"load" | "generate">("load");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load mode state
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);

  // Generate mode state
  const [generated, setGenerated] = useState<GeneratedAssessment | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const [lang] = useLang();

  // ── Load existing assessments ───────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!classId) { setError(t("enterClassId", lang)); return; }
    setLoading(true); setError(""); setGenerated(null);
    try {
      const res = await fetch(`/api/assessments?classId=${encodeURIComponent(classId)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to load assessments"); return; }
      setAssessments(json.assessments ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [classId, lang]);

  // ── Generate new assessment ─────────────────────────────────────────────────

  async function generate() {
    if (!classId) { setError(t("enterClassId", lang)); return; }
    if (!topicId.trim()) { setError(t("enterTopic", lang)); return; }
    setLoading(true); setError(""); setAssessments([]); setGenerated(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          subjectId,
          topicId: topicId.trim(),
          grade: 6,                    // default grade — matches existing agent assumption
          difficulty,
          studentMasteryLevel: 50,     // neutral default for draft generation
          questionCount,
          questionType,
          lang,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Generation failed"); return; }
      const data = json.data ?? json;
      setGenerated({
        assessmentId: data.assessmentId ?? data._id ?? "generated",
        questions: data.questions ?? [],
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // ── Approve / reject feedback ───────────────────────────────────────────────

  async function approve(assessmentId: string, studentId: string, status: "approved" | "rejected") {
    const key = `${assessmentId}_${studentId}`;
    setActioning(key);
    try {
      await fetch(`/api/assessments/${assessmentId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status }),
      });
      await load();
    } finally {
      setActioning(null);
    }
  }

  const pending = assessments.filter((a) =>
    a.studentResponses.some((r) => r.feedbackStatus === "pending_review")
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("assessments", lang)}</h1>

      {/* Controls card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">

        {/* Shared fields row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("classId", lang)}</label>
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={t("classIdPlaceholder", lang)}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("subject", lang)}</label>
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="math">{t("math", lang)}</option>
              <option value="science">{t("science", lang)}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("topic", lang)}</label>
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={t("topicPlaceholder", lang)}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("difficulty", lang)}</label>
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            >
              <option value="easy">{t("easy", lang)}</option>
              <option value="medium">{t("medium", lang)}</option>
              <option value="hard">{t("hard", lang)}</option>
            </select>
          </div>
        </div>

        {/* Generate-only fields — visible only when Generate tab is active */}
        {mode === "generate" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("questionCount", lang)}</label>
              <input
                type="number"
                min={2}
                max={20}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(2, Math.min(20, Number(e.target.value))))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("questionType", lang)}</label>
              <select
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as "mcq" | "short_answer" | "mixed")}
              >
                <option value="mixed">{t("mixedQuestions", lang)}</option>
                <option value="mcq">{t("mcqOnly", lang)}</option>
                <option value="short_answer">{t("shortAnswerOnly", lang)}</option>
              </select>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("load"); load(); }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && mode === "load" ? t("loading", lang) : t("loadExisting", lang)}
          </button>
          <button
            onClick={() => { setMode("generate"); generate(); }}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading && mode === "generate" ? t("generating", lang) : t("generateNew", lang)}
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* ── Generated assessment preview ───────────────────────────────────────── */}
      {generated && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {t("generatedAssessment", lang)} — {subjectId} · {topicId}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {generated.questions.length} {t("questions", lang)} · {difficulty} · {questionType === "mixed" ? "MCQ + Short Answer" : questionType === "mcq" ? "MCQ" : "Short Answer"}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{t("draft", lang)}</span>
          </div>

          <div className="space-y-3">
            {generated.questions.map((q, i) => {
              const isOpen = expandedQuestion === q.id;
              return (
                <div key={q.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedQuestion(isOpen ? null : q.id)}
                  >
                    <span className="text-sm text-gray-800">
                      <span className="text-gray-400 mr-1.5">{i + 1}.</span>
                      {q.text}
                      <span className="ml-2 text-xs text-gray-400">({q.marks} mark{q.marks > 1 ? "s" : ""})</span>
                    </span>
                    <span className="shrink-0 ml-3 text-gray-400">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3 pt-0 bg-gray-50 border-t border-gray-100">
                      {q.type === "mcq" && q.options ? (
                        <ul className="space-y-1 mt-2">
                          {q.options.map((opt) => (
                            <li
                              key={opt.id}
                              className={`text-sm px-2 py-1 rounded ${
                                opt.id === q.correctAnswer
                                  ? "bg-green-50 text-green-800 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              <span className="font-medium uppercase mr-1">{opt.id}.</span>
                              {opt.text}
                              {opt.id === q.correctAnswer && (
                                <span className="ml-2 text-xs text-green-600">✓ {t("correct", lang)}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">{t("expectedAnswer", lang)}</p>
                          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded px-2 py-1.5">
                            {q.correctAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            {t("assessmentSaved", lang)} (ID: {generated.assessmentId})
          </p>
        </div>
      )}

      {/* ── Existing assessments — feedback review ─────────────────────────────── */}
      {assessments.length > 0 && (
        <>
          {pending.length === 0 ? (
            <p className="text-sm text-green-600 mb-4">{t("allFeedbackReviewed", lang)}</p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">{pending.length} {t("assessments", lang)} {t("pendingFeedback", lang)}</p>
          )}

          {pending.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-sm font-semibold text-gray-800">{a.subjectId} — {a.topicId}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{a.difficulty}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 ml-auto">
                  {a.studentResponses.filter((r) => r.feedbackStatus === "pending_review").length} {t("pending", lang)}
                </span>
              </div>

              <div className="space-y-3">
                {a.studentResponses
                  .filter((r) => r.feedbackStatus === "pending_review")
                  .map((r) => {
                    const key = `${a._id}_${r.studentId}`;
                    return (
                      <div key={key} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">{t("student", lang)}: {r.studentId}</span>
                          <span className="text-xs font-medium text-gray-700">
                            {r.score}/{r.maxScore} ({Math.round((r.score / Math.max(r.maxScore, 1)) * 100)}%)
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 italic">&ldquo;{r.feedbackText}&rdquo;</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve(a._id, r.studentId, "approved")}
                            disabled={actioning === key}
                            className="flex items-center gap-1.5 text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle size={13} /> {t("approve", lang)}
                          </button>
                          <button
                            onClick={() => approve(a._id, r.studentId, "rejected")}
                            disabled={actioning === key}
                            className="flex items-center gap-1.5 text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={13} /> {t("reject", lang)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
