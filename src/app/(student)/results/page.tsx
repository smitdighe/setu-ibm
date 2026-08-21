/**
 * Student — My Results page.
 * Shows all graded assessments for the student with FeedbackCards.
 * Feedback is only visible when feedbackStatus === "approved".
 */
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import FeedbackCard from "@/components/FeedbackCard";

type Response = {
  studentId: string;
  score: number;
  maxScore: number;
  feedbackText: string;
  feedbackStatus: "pending_review" | "approved" | "rejected";
  gradedAt: string;
};
type Assessment = {
  _id: string;
  topicId: string;
  subjectId: string;
  studentResponses: Response[];
};

export default function StudentResultsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.classId) return;
    setLoading(true);
    fetch(`/api/assessments?classId=${user.classId}`)
      .then((r) => r.json())
      .then((json) => setAssessments(json.assessments ?? []))
      .finally(() => setLoading(false));
  }, [user?.classId]);

  // Filter to only responses belonging to this student
  const myResults = assessments
    .flatMap((a) =>
      a.studentResponses
        .filter((r) => r.studentId === user?.id)
        .map((r) => ({ ...r, topicId: a.topicId, subjectId: a.subjectId, assessmentId: a._id }))
    )
    .sort((a, b) => b.gradedAt.localeCompare(a.gradedAt));

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-1">My Results</h1>
      <p className="text-sm text-gray-500 mb-6">Your assessment history and teacher feedback</p>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && myResults.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No results yet. Take an assessment to get started!</p>
      )}

      <div className="space-y-4">
        {myResults.map((r, i) => (
          <div key={i}>
            <p className="text-xs text-gray-400 mb-1">
              {r.subjectId} — {new Date(r.gradedAt).toLocaleDateString()}
            </p>
            <FeedbackCard
              topicId={r.topicId}
              score={r.score}
              maxScore={r.maxScore}
              feedbackText={r.feedbackText}
              feedbackStatus={r.feedbackStatus}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
