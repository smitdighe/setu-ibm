"use client";

import type { ContentBlock } from "@/types/entities";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

type Props = { contentBlocks: ContentBlock[]; printableUrl?: string };
const LEVEL_STYLE: Record<string, { badge: string; border: string; key: "remedial" | "onTrack" | "advanced" }> = {
  remedial: { badge: "bg-red-100 text-red-700", border: "border-red-200", key: "remedial" },
  on_track: { badge: "bg-yellow-100 text-yellow-700", border: "border-yellow-200", key: "onTrack" },
  advanced: { badge: "bg-green-100 text-green-700", border: "border-green-200", key: "advanced" },
};

export default function LessonPlanViewer({ contentBlocks, printableUrl }: Props) {
  const [lang] = useLang();
  if (!contentBlocks?.length) return <p className="text-sm text-gray-400">{t("noContentBlocks", lang)}</p>;

  return <div className="space-y-5">
    {printableUrl && <a href={printableUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">🖨 {t("openPrintable", lang)}</a>}
    {contentBlocks.map((block, index) => {
      const style = LEVEL_STYLE[block.level] ?? LEVEL_STYLE.on_track;
      return <div key={index} className={`border ${style.border} rounded-lg p-4 space-y-3`}>
        <div className="flex items-center gap-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{t(style.key, lang)}</span><h3 className="text-sm font-semibold text-gray-800">{block.title}</h3><span className="ml-auto text-xs text-gray-400">~{block.estimatedMinutes} {t("minutes", lang)}</span></div>
        <p className="text-sm text-gray-700 leading-relaxed">{block.explanation}</p>
        <div className="bg-blue-50 rounded p-3"><p className="text-xs font-semibold text-blue-700 mb-1">{t("activity", lang)}</p><p className="text-sm text-gray-700">{block.activity}</p></div>
        <div className="bg-gray-50 rounded p-3 border border-gray-100"><p className="text-xs font-semibold text-gray-600 mb-1">{t("worksheet", lang)}</p><pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{block.worksheet}</pre></div>
      </div>;
    })}
  </div>;
}
