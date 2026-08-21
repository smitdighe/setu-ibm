/**
 * RecommendationCard — one resource in the student feed.
 */
"use client";

type Props = {
  title: string;
  description: string;
  source: "oer" | "skillsbuild";
  difficulty: "easy" | "medium" | "hard";
  url: string;
  reason: string;
  score: number;
};

const SOURCE_LABEL: Record<string, string> = {
  oer: "OER Commons",
  skillsbuild: "IBM SkillsBuild",
};
const DIFF_STYLE: Record<string, string> = {
  easy:   "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard:   "bg-red-100 text-red-700",
};

export default function RecommendationCard({ title, description, source, difficulty, url, reason }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">{title}</h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_STYLE[difficulty]}`}>
          {difficulty}
        </span>
      </div>
      {description && <p className="text-xs text-gray-500 leading-relaxed">{description}</p>}
      <p className="text-xs text-gray-400 italic">{reason}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-blue-600 font-medium">{SOURCE_LABEL[source] ?? source}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open →
        </a>
      </div>
    </div>
  );
}
