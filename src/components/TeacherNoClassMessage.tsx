"use client";

import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

export default function TeacherNoClassMessage() {
  const [lang] = useLang();
  return <div className="p-8 text-gray-500">{t("noClassesAssigned", lang)}</div>;
}
