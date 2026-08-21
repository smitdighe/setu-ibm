"use client";

import { useLang } from "@/hooks/useLang";

export default function LanguageToggle() {
  const [lang, setLang] = useLang();

  return (
    <div className="flex w-46 items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
      <button
        onClick={() => setLang("en")}
        className={`flex-1 rounded-full px-2 py-1 text-center transition-colors ${
          lang === "en" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
        aria-pressed={lang === "en"}
        aria-label="Switch to English"
      >
        English
      </button>
      <button
        onClick={() => setLang("gu")}
        className={`flex-1 rounded-full px-2 py-1 text-center transition-colors ${
          lang === "gu" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
        aria-pressed={lang === "gu"}
        aria-label="ગુજરાતી ભાષા પસંદ કરો"
      >
        ગુજરાતી
      </button>
    </div>
  );
}