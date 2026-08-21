/**
 * NextAuth configuration — credentials provider against Cloudant.
 *
 * Session shape: { userId, role, schoolId, classId? }
 * Supports three roles: teacher | admin | student
 *
 * Password hashing: bcryptjs (pure JS, no native deps needed on Code Engine).
 * ASSUMPTION: bcryptjs is used; add it: npm install bcryptjs @types/bcryptjs
 */

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findDocs, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Student, Teacher, Admin } from "@/types/entities";
import type { UserRole } from "@/types/agents";

// Lazy bcrypt import so the module loads even without the package during typecheck
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as { compare: (a: string, b: string) => Promise<boolean> };

type AnyUser = (Student | Teacher | Admin) & { _id: string };

async function findUserByEmail(email: string): Promise<{ user: AnyUser; role: UserRole } | null> {
  // Check teachers first, then admins, then students
  const [teachers, admins, students] = await Promise.all([
    findDocs<Teacher>(DB_NAMES.teachers, { type: "teacher", email }),
    findDocs<Admin>(DB_NAMES.admins, { type: "admin", email }),
    findDocs<Student>(DB_NAMES.students, { type: "student", email }),
  ]);

  if (teachers[0]) return { user: teachers[0] as AnyUser, role: "teacher" };
  if (admins[0]) return { user: admins[0] as AnyUser, role: "admin" };
  if (students[0]) return { user: students[0] as AnyUser, role: "student" };
  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Setu Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const found = await findUserByEmail(credentials.email);
        if (!found) return null;

        const valid = await bcrypt.compare(credentials.password, found.user.passwordHash);
        if (!valid) return null;

        return {
          id: found.user._id!,
          name: found.user.name,
          email: found.user.email,
          role: found.role,
          schoolId: found.user.schoolId,
          // classId only on students
          classId: (found.user as Student).classId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.role = u.role;
        token.schoolId = u.schoolId;
        token.classId = u.classId;
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = session as any;
      s.user.id = token.sub;
      s.user.role = token.role;
      s.user.schoolId = token.schoolId;
      s.user.classId = token.classId;
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
