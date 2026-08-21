/**
 * Login page — credentials form calling NextAuth signIn().
 */
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const [lang] = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await signIn("credentials", {
      email, password, redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(t("invalidCredentials", lang));
    } else {
      // Read the session role to route correctly — do not hardcode /teacher
      const session = await getSession();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (session?.user as any)?.role;
      if (role === "student") {
        router.replace("/student");
      } else {
        router.replace("/teacher");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t("appName", lang)}</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{t("signIn", lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("hero", lang)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{t("email", lang)}</label>
            <input
              type="email"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{t("password", lang)}</label>
            <input
              type="password"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder", lang)}
            />
          </div>
          {error && <p className="text-sm text-blue-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t("signingIn", lang) : t("signIn", lang)}
          </button>
        </form>
      </div>
    </div>
  );
}
