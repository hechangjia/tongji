import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import type { SessionRole } from "@/lib/permissions";
import { loginSchema } from "@/lib/validators/auth";

type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: SessionRole;
  status: "ACTIVE" | "INACTIVE";
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: env.AUTH_TRUST_HOST === "true",
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours — short window so deactivated users lose access quickly
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "账号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { username, password } = parsedCredentials.data;
        const user = await db.user.findUnique({
          where: { username },
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.username = user.username;
        token.lastCheckedAt = Date.now();
      } else if (token.id) {
        // Re-check user status from DB at most every 5 minutes
        const fiveMinutes = 5 * 60 * 1000;
        const lastChecked = (token.lastCheckedAt as number) ?? 0;

        if (Date.now() - lastChecked > fiveMinutes) {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true },
          });

          if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
            return { ...token, status: "INACTIVE" as const };
          }

          token.role = dbUser.role;
          token.status = dbUser.status;
          token.lastCheckedAt = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as SessionRole;
        session.user.status = token.status as "ACTIVE" | "INACTIVE";
        session.user.username = token.username as string;
      }

      return session;
    },
  },
});
