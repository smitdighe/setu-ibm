/**
 * Teacher Dashboard layout — sidebar nav + school header + role guard.
 * Redirects non-teachers to /login.
 */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  LogOut,
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [lang] = useLang();

  const NAV = [
    { href: "/teacher", label: t("overview", lang), icon: LayoutDashboard },
    { href: "/teacher/lesson-plans", label: t("lessonPlans", lang), icon: BookOpen },
    { href: "/teacher/assessments", label: t("assessments", lang), icon: ClipboardList },
  ];

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (status === "authenticated" && (session?.user as any)?.role === "student") {
      router.replace("/student");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center text-gray-500">{t("loading", lang)}</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("appName", lang)}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{user?.name ?? "Teacher"}</p>
          <p className="text-xs text-gray-500 truncate">{user?.schoolId}</p>
          <div className="mt-2">
            <LanguageToggle />
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/teacher" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            {t("signOut", lang)}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
