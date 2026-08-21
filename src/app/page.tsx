/**
 * Landing page — hero + features.
 * Nav is a client component (HeroNav) to support the language toggle.
 * Feature card content is static and intentionally English-only on the hero;
 * the i18n strings cover the highest-visibility labels.
 */
"use client";

import HeroNav from "@/components/HeroNav";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

export default function Home() {
  const [lang] = useLang();

  const features = [
    {
      titleKey: "feature1Title" as const,
      descKey: "feature1Desc" as const,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-2">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
        </svg>
      ),
    },
    {
      titleKey: "feature2Title" as const,
      descKey: "feature2Desc" as const,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-2">
          <path d="M12 3v18M3 12h18" />
          <path d="M17 4.5 19.5 7 17 9.5 14.5 7 17 4.5Z" />
        </svg>
      ),
    },
    {
      titleKey: "feature3Title" as const,
      descKey: "feature3Desc" as const,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-2">
          <path d="M4 19V5M4 19h16" />
          <path d="m7 15 4-4 3 2 5-6" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <HeroNav />

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-28">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">{t("tagline", lang)}</p>
        <h1 className="setu-enter mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          {t("hero", lang)}
        </h1>
        <p className="setu-enter mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600" style={{ animationDelay: "100ms" }}>
          {t("heroSub", lang)}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24" aria-label="Setu features">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.titleKey}
              className="setu-enter rounded-xl border border-blue-100 bg-white p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-md"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {feature.icon}
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-900">{t(feature.titleKey, lang)}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{t(feature.descKey, lang)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
