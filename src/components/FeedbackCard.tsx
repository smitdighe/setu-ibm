/**
 * FeedbackCard — shows score + Granite-generated feedback for one assessment response.
 * Only renders feedback text when feedbackStatus === "approved".
 */
"use client";

type Props = {
  topicId: string;
  score: number;
  maxScore: number;
  feedbackText: string;
  feedbackStatus: "pending_review" | "approved" | "rejected";
};

export default function FeedbackCard({ topicId, score, maxScore, feedbackText, feedbackStatus }: Props) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600";
  const bgRing = pct >= 80 ? "ring-green-300" : pct >= 50 ? "ring-yellow-300" : "ring-red-300";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-4 mb-4">
        {/* Score ring */}
        <div className={`w-16 h-16 rounded-full ring-4 ${bgRing} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-lg font-bold ${color}`}>{pct}%</span>
          <span className="text-xs text-gray-400">{score}/{maxScore}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{topicId}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort — keep going!" : "Keep practising — you can do it!"}
          </p>
        </div>
      </div>

      {/* Feedback — gated on approval */}
      {feedbackStatus === "approved" ? (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Teacher Feedback</p>
          <p className="text-sm text-gray-700 leading-relaxed">{feedbackText}</p>
        </div>
      ) : feedbackStatus === "pending_review" ? (
        <p className="text-xs text-gray-400 italic">
          Feedback is being reviewed by your teacher. Check back soon!
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic">Feedback not available for this assessment.</p>
      )}
    </div>
  );
}
