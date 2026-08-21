/**
 * Student Dashboard (/student)
 *
 * Two sections:
 *  1. My Progress — risk score, learning pace, and per-topic mastery bars.
 *     Data from GET /api/students/[id]/analytics (self-only, enforced server-side).
 *  2. Recommended Resources — ranked resource feed for the student's weak topics.
 *     Data from GET /api/recommendations/[id] (existing endpoint, student-scoped).
 *
 * Read-only — no write actions. Respects useLang() for UI labels.
 *
 * Note: Teacher Assistant chat (/api/chat) rejects student role with 403.
 * Chat is therefore omitted from this view — no fork of ChatWidget needed.
 */
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import RecommendationCard from "@/components/RecommendationCard";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";
import type { RankedResource } from "@/agents/recommendation/types";

// ── Local types (mirrors AnalyticsOutput shape) ───────────────────────────────

type TopicMastery = {
  topicId: string;
  score: number;
  trend: "improving" | "declining" | "stable";
};

type AnalyticsData = {
  riskScore: number;
  riskFlag: boolean;
  masteryByTopic: TopicMastery[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function riskColor(score: number): string {
  if (score >= 0.7) return "text-red-600";
  if (score >= 0.4) return "text-yellow-600";
  return "text-green-600";
}

function riskRingColor(score: number): string {
  if (score >= 0.7) return "ring-red-300";
  if (score >= 0.4) return "ring-yellow-300";
  return "ring-green-300";
}

function masteryBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const [lang] = useLang();

  // Subject selector (shared between both sections)
  const [subjectId, setSubjectId] = useState("math");

  // Progress section
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // Recommendations section
  const [recommendations, setRecommendations] = useState<RankedResource[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    loadAnalytics();
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, subjectId]);

  async function loadAnalytics() {
    setAnalyticsLoading(true); setAnalyticsError("");
    try {
      const res = await fetch(
        `/api/students/${user.id}/analytics?subjectId=${subjectId}`
      );
      const json = await res.json();
      if (!res.ok) { setAnalyticsError(json.error ?? "Failed"); return; }
      const data = json.data ?? json;
      setAnalytics({
        riskScore: data.riskScore ?? 0,
        riskFlag: data.riskFlag ?? false,
        masteryByTopic: data.masteryByTopic ?? [],
      });
    } catch (e) {
      setAnalyticsError(String(e));
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadRecommendations() {
    setRecsLoading(true); setRecsError("");
    try {
      const res = await fetch(
        `/api/recommendations/${user.id}?subjectId=${subjectId}`
      );
      const json = await res.json();
      if (!res.ok) { setRecsError(json.error ?? "Failed"); return; }
      setRecommendations(json.data?.recommendations ?? []);
    } catch (e) {
      setRecsError(String(e));
    } finally {
      setRecsLoading(false);
    }
  }

  const paceKey = `pace_${user?.learningPace ?? "average"}` as
    | "pace_slow"
    | "pace_average"
    | "pace_fast";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header + subject switcher */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{t("myProgress", lang)}</h1>
          <p className="text-sm text-gray-500">{t("myProgressSub", lang)}</p>
        </div>
        <div className="shrink-0">
          <label className="text-xs text-gray-500 block mb-1">{t("subject", lang)}</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="math">Math</option>
            <option value="science">Science</option>
          </select>
        </div>
      </div>

      {/* ── Progress section ────────────────────────────────────────────────── */}
      {analyticsLoading && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {analyticsError && (
        <p className="text-sm text-red-600 mb-4">{analyticsError}</p>
      )}

      {!analyticsLoading && analytics && (
        <>
          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Risk score ring */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full ring-4 ${riskRingColor(analytics.riskScore)} flex flex-col items-center justify-center shrink-0`}
              >
                <span className={`text-base font-bold ${riskColor(analytics.riskScore)}`}>
                  {Math.round(analytics.riskScore * 100)}%
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("riskScore", lang)}</p>
                <p className={`text-sm font-semibold mt-0.5 ${riskColor(analytics.riskScore)}`}>
                  {analytics.riskScore >= 0.7
                    ? (lang === "gu" ? "\u0aa7\u0acd\u0aaf\u0abe\u0aa8 \u0a86\u0aaa\u0acb" : "Needs attention")
                    : analytics.riskScore >= 0.4
                    ? (lang === "gu" ? "\u0aa6\u0ac7\u0a96\u0ab0\u0ac7\u0a96 \u0a95\u0ab0\u0acb" : "Keep watching")
                    : (lang === "gu" ? "\u0ab8\u0abe\u0ab0\u0ac1\u0a82 \u0a9a\u0abe\u0ab2\u0ac7 \u0a9b\u0ac7" : "On track")}
                </p>
              </div>
            </div>

            {/* Learning pace */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">{t("learningPace", lang)}</p>
              <p className="text-xl font-bold text-gray-800 capitalize">
                {t(paceKey, lang)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{subjectId}</p>
            </div>
          </div>

          {/* Mastery by topic */}
          {analytics.masteryByTopic.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                {t("masteryByTopic", lang)}
              </h2>
              <div className="space-y-3">
                {analytics.masteryByTopic.map((topic) => {
                  const trendKey = `trend_${topic.trend}` as
                    | "trend_improving"
                    | "trend_declining"
                    | "trend_stable";
                  return (
                    <div key={topic.topicId}>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span className="capitalize">{topic.topicId.replace(/_/g, " ")}</span>
                        <span className="flex items-center gap-2">
                          <span
                            className={
                              topic.trend === "improving"
                                ? "text-green-600"
                                : topic.trend === "declining"
                                ? "text-red-600"
                                : "text-gray-400"
                            }
                          >
                            {t(trendKey, lang)}
                          </span>
                          <span className="font-medium text-gray-800">{topic.score}/100</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${masteryBarColor(topic.score)}`}
                          style={{ width: `${topic.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Recommendations section ─────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-gray-700">{t("myRecommendations", lang)}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{t("myRecommendationsSub", lang)}</p>
      </div>

      {recsLoading && (
        <div className="space-y-3 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {recsError && <p className="text-sm text-red-600 mt-3">{recsError}</p>}

      {!recsLoading && !recsError && recommendations.length === 0 && (
        <div className="text-center py-10 mt-3">
          <p className="text-sm text-gray-400">{t("noRecommendations", lang)}</p>
          <p className="mt-1 text-xs text-gray-400">{t("noRecommendationsSub", lang)}</p>
        </div>
      )}

      <div className="space-y-3 mt-3">
        {recommendations.map((r, i) => (
          <RecommendationCard
            key={r._id ?? i}
            title={r.title}
            description={r.description}
            source={r.source}
            difficulty={r.difficulty}
            url={r.url}
            reason={r.reason}
            score={r.score}
          />
        ))}
      </div>
    </div>
  );
}
