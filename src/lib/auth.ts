/**
 * Auth middleware helpers.
 *
 * withRole() wraps a Next.js route handler, reads the NextAuth session,
 * and returns 401/403 before the handler runs if the caller lacks permission.
 *
 * Also exports getRequiredSession() for use inside route handlers that need
 * the session object directly.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { UserRole } from "@/types/agents";

export type SetuSession = {
  userId: string;
  role: UserRole;
  schoolId: string;
  classId?: string;
};

/**
 * Extract and validate the session from a request.
 * Returns null if unauthenticated.
 */
export async function getRequiredSession(): Promise<SetuSession | null> {
  // Dev bypass when NEXTAUTH_SECRET is not set
  if (!process.env.NEXTAUTH_SECRET) {
    return {
      userId: "dev_user_001",
      role: "teacher",
      schoolId: "school_guj_001",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) return null;

  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId,
    classId: session.user.classId,
  };
}

type RouteHandler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>;

/**
 * Role-guard wrapper for Next.js App Router route handlers.
 *
 * Usage:
 *   export const GET = withRole(["teacher", "admin"], async (req, ctx, session) => { ... });
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, ctx: { params: Record<string, string> }, session: SetuSession) => Promise<NextResponse>
): RouteHandler {
  return async (req, ctx) => {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: `Role "${session.role}" not permitted` }, { status: 403 });
    }
    return handler(req, ctx, session);
  };
}
