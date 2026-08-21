"use client";

import SkillDistributionChart from "@/components/SkillDistributionChart";
import AtRiskStudentList from "@/components/AtRiskStudentList";
import ChatWidget from "@/components/ChatWidget";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

type Student = { _id: string; name: string; riskScore: number; learningPace: string };
type Props = {
  grade: number;
  section: string;
  subjectName: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  totalStudents: number;
  students: Student[];
  distribution: { remedial: number; onTrack: number; advanced: number };
};

export default function TeacherOverviewContent({
  grade, section, subjectName, classId, subjectId, sessionId, totalStudents, students, distribution,
}: Props) {
  const [lang] = useLang();
  const averageRisk = Math.round((students.length / Math.max(totalStudents, 1)) * 100);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Class {grade}{section} — {subjectName}</h1>
      <p className="text-sm text-gray-500 mb-6">{totalStudents} {t("students", lang)} · {students.length} {t("atRisk", lang)}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t("skillDistribution", lang)}</h2>
          <SkillDistributionChart {...distribution} />
          <div className="mt-3 flex justify-around text-center">
            <Stat label={t("remedial", lang)} value={distribution.remedial} color="text-red-600" />
            <Stat label={t("onTrack", lang)} value={distribution.onTrack} color="text-yellow-600" />
            <Stat label={t("advanced", lang)} value={distribution.advanced} color="text-green-600" />
          </div>
        </div>
        <div className="space-y-4">
          <StatCard label={t("totalStudents", lang)} value={totalStudents} />
          <StatCard label={t("atRiskStudents", lang)} value={students.length} accent />
          <StatCard label={t("avgClassRisk", lang)} value={`${averageRisk}%`} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">{t("atRiskStudents", lang)}</h2>
        <AtRiskStudentList students={students} classId={classId} subjectId={subjectId} />
      </div>
      <ChatWidget classId={classId} sessionId={sessionId} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-gray-500 mt-0.5">{label}</p></div>;
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return <div className={`bg-white rounded-xl border p-4 ${accent ? "border-red-200" : "border-gray-200"}`}><p className="text-xs text-gray-500">{label}</p><p className={`text-2xl font-bold mt-1 ${accent ? "text-red-600" : "text-gray-800"}`}>{value}</p></div>;
}
