/**
 * Root layout — wraps entire app with NextAuth SessionProvider.
 */
import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Setu — AI Personalized Learning",
  description: "A bridge to every student's pace",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLang = (await cookies()).get("setu_lang")?.value;
  const initialLang: Lang = cookieLang === "gu" ? "gu" : "en";

  return (
    <html lang={initialLang}>
      <body className="antialiased">
        <SessionProviderWrapper initialLang={initialLang}>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
