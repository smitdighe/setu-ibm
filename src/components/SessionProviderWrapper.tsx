/**
 * SessionProviderWrapper — client component that wraps the app with NextAuth SessionProvider.
 * Must be a separate client component so the root layout stays a server component.
 */
"use client";
import { SessionProvider } from "next-auth/react";
import { LangProvider } from "@/hooks/useLang";
import type { Lang } from "@/lib/i18n";

export function SessionProviderWrapper({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  return <SessionProvider><LangProvider initialLang={initialLang}>{children}</LangProvider></SessionProvider>;
}
