/**
 * AssessmentForm — renders questions and submits student answers.
 */
"use client";

import { useState } from "react";
import type { Question } from "@/types/entities";

type Props = {
  assessmentId: string;
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
};

export default function AssessmentForm({ assessmentId: _id, questions, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const answered = Object.keys(answers).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(answers); } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-1.5 bg-blue-500 rounded-full transition-all"
            style={{ width: `${(answered / Math.max(questions.length, 1)) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{answered}/{questions.length}</span>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-800 mb-3">
            <span className="text-gray-400 mr-1">{i + 1}.</span> {q.text}
            <span className="ml-2 text-xs text-gray-400">({q.marks} mark{q.marks > 1 ? "s" : ""})</span>
          </p>

          {q.type === "mcq" && q.options ? (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    answers[q.id] === opt.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="mr-1 font-medium uppercase text-gray-700">{opt.id}.</span>{opt.text}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              rows={3}
              placeholder="Write your answer here…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting || answered === 0}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Submitting…" : "Submit Assessment"}
      </button>
    </form>
  );
}
