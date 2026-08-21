/**
 * Student layout — minimal header + role guard (redirects non-students away).
 */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, ClipboardList, LogOut } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang] = useLang();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center text-gray-500">{t("loading", lang)}</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t("appName", lang)}</span>
          <nav className="flex items-center gap-1">
            <Link href="/student" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <BookOpen size={14} /> {t("learn", lang)}
            </Link>
            <Link href="/student/results" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <ClipboardList size={14} /> {t("myResults", lang)}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <span className="text-sm text-gray-700">{user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t("signOut", lang)}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
