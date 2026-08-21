/**
 * Teacher — Lesson Plans page.
 * Week picker → fetch/display lesson plan. "Generate New" button.
 */
"use client";

import { useState } from "react";
import LessonPlanViewer from "@/components/LessonPlanViewer";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";
import type { ContentBlock } from "@/types/entities";

export default function LessonPlansPage() {
  const [lang] = useLang();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("math");
  const [topicId, setTopicId] = useState("");
  const [weekOf, setWeekOf] = useState(thisMonday());
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[] | null>(null);
  const [printableUrl, setPrintableUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);

  async function load(forceRegen = false) {
    if (!classId) { setError(t("enterClassId", lang)); return; }
    setLoading(true); setError(""); setContentBlocks(null);
    try {
      const params = new URLSearchParams({ subjectId, topicId: topicId || "general" });
      if (forceRegen) params.set("generate", "true");
      const res = await fetch(
        `/api/lesson-plans/${encodeURIComponent(classId)}/${weekOf}?${params}`
      );
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed"); return; }

      // Handle both cached (lessonPlan doc) and generated (OrchestratorResult) shapes
      const plan = json.lessonPlan ?? json.data;
      setContentBlocks(plan?.contentBlocks ?? []);
      setPrintableUrl(plan?.printableUrl ?? plan?.cosKey);
      setFromCache(!!json.fromCache || !!plan?.fromCache);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("lessonPlans", lang)}</h1>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
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
            <label className="text-xs text-gray-500 mb-1 block">{t("weekOf", lang)}</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(false)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t("loading", lang) : t("loadPlan", lang)}
          </button>
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t("generateNew", lang)}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Plan viewer */}
      {contentBlocks !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {fromCache && (
            <p className="text-xs text-gray-400 mb-3">{t("servedFromCache", lang)}</p>
          )}
          <LessonPlanViewer contentBlocks={contentBlocks} printableUrl={printableUrl} />
        </div>
      )}
    </div>
  );
}

function thisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().slice(0, 10);
}
