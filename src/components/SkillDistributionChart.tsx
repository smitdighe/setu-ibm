"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

type Props = { remedial: number; onTrack: number; advanced: number };
const COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

export default function SkillDistributionChart({ remedial, onTrack, advanced }: Props) {
  const [lang] = useLang();
  const data = [
    { name: t("remedial", lang), value: remedial },
    { name: t("onTrack", lang), value: onTrack },
    { name: t("advanced", lang), value: advanced },
  ];
  if (remedial + onTrack + advanced === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">{t("noDataYet", lang)}</p>;
  }

  return <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
        {data.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}
      </Pie>
      <Tooltip formatter={(value) => [`${value} ${t("students", lang)}`, ""]} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>;
}
