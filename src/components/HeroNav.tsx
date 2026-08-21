/**
 * HeroNav — client-side nav bar on the landing page.
 * Includes the language toggle and Sign In button with translated labels.
 */
"use client";

import LanguageToggle from "@/components/LanguageToggle";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

export default function HeroNav() {
  const [lang] = useLang();
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5" aria-label="Primary navigation">
      <span className="text-xl font-bold tracking-[0.18em] text-blue-600">{t("appName", lang)}</span>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <a
          href="/login"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-[background-color,box-shadow] duration-200 hover:bg-blue-700 hover:shadow-sm"
        >
          {t("signIn", lang)}
        </a>
      </div>
    </nav>
  );
}
