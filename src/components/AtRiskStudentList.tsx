"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

type Student = { _id: string; name: string; riskScore: number; learningPace: string };
type Props = { students: Student[]; classId: string; subjectId: string };

export default function AtRiskStudentList({ students, classId, subjectId }: Props) {
  const [lang] = useLang();
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  async function generatePlan(studentId: string) {
    setLoading(studentId);
    try {
      await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "generate_lesson", payload: { classId, subjectId, grade: 6, topicId: "revision", weekOf: thisMonday(), skillDistribution: { remedial: 1, onTrack: 0, advanced: 0 }, curriculumStandard: "NCERT Grade 6 Revision" } }),
      });
      setDone((previous) => new Set(previous).add(studentId));
    } finally { setLoading(null); }
  }

  if (!students.length) return <p className="text-sm text-gray-500 py-4">{t("noAtRiskStudents", lang)}</p>;
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
    <th className="py-2 pr-4">{t("student", lang)}</th><th className="py-2 pr-4">{t("riskScore", lang)}</th><th className="py-2 pr-4">{t("pace", lang)}</th><th className="py-2">{t("action", lang)}</th>
  </tr></thead><tbody>{students.map((student) => <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-2 pr-4 font-medium text-gray-800 flex items-center gap-2"><AlertTriangle size={14} className="text-red-500 shrink-0" />{student.name}</td>
    <td className="py-2 pr-4"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${student.riskScore > 0.8 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{Math.round(student.riskScore * 100)}%</span></td>
    <td className="py-2 pr-4 capitalize text-gray-600">{student.learningPace === "slow" ? t("pace_slow", lang) : student.learningPace === "fast" ? t("pace_fast", lang) : t("pace_average", lang)}</td>
    <td className="py-2">{done.has(student._id) ? <span className="text-green-600 text-xs">{t("planSent", lang)}</span> : <button onClick={() => generatePlan(student._id)} disabled={loading === student._id} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">{loading === student._id ? t("generating", lang) : t("remedialPlan", lang)}</button>}</td>
  </tr>)}</tbody></table></div>;
}

function thisMonday(): string {
  const date = new Date(); const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date.toISOString().slice(0, 10);
}
