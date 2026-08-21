/**
 * Student — Take Assessment page.
 * Loads an active assessment by ID, renders AssessmentForm,
 * submits answers to POST /api/agent (intent: "assess"), then navigates to results.
 */
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AssessmentForm from "@/components/AssessmentForm";
import type { Question } from "@/types/entities";

export default function TakeAssessmentPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<{ classId: string; subjectId: string; topicId: string; difficulty: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch the assessment to get its questions
    fetch(`/api/assessments?classId=${user?.classId ?? ""}`)
      .then((r) => r.json())
      .then((json) => {
        const found = (json.assessments ?? []).find((a: { _id: string }) => a._id === params.id);
        if (found) {
          setQuestions(found.questions ?? []);
          setMeta({ classId: found.classId, subjectId: found.subjectId, topicId: found.topicId, difficulty: found.difficulty });
        } else {
          setError("Assessment not found.");
        }
      })
      .catch(() => setError("Failed to load assessment."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user?.classId]);

  async function handleSubmit(answers: Record<string, string>) {
    if (!meta || !user?.id) return;
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "assess",
        payload: {
          classId: meta.classId,
          subjectId: meta.subjectId,
          topicId: meta.topicId,
          grade: 6,
          difficulty: meta.difficulty,
          studentMasteryLevel: 50,
          questionCount: questions.length,
          studentIds: [user.id],
          studentAnswers: { [user.id]: answers },
        },
      }),
    });
    const json = await res.json();
    if (json.success) {
      router.push("/student/results");
    } else {
      setError(json.error ?? "Submission failed.");
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>;
  if (error) return <p className="text-sm text-red-600 py-8 text-center">{error}</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">Assessment</h1>
        {meta && (
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.subjectId} — {meta.topicId} · <span className="capitalize text-gray-500">{meta.difficulty}</span>
          </p>
        )}
      </div>
      <AssessmentForm
        assessmentId={params.id}
        questions={questions}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
