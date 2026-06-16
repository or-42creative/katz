import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ?? "or@42creative.co.il"
).toLowerCase();

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [Google],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      // Super admin always allowed.
      if (email === SUPER_ADMIN_EMAIL) return true;
      // Optionally restrict to a single org domain.
      if (ALLOWED_DOMAIN && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        let role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL) role = "ADMIN";
        session.user.role = role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Make sure the super admin always has the ADMIN role persisted.
      if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL && user.id) {
        await prisma.user
          .update({ where: { id: user.id }, data: { role: "ADMIN" } })
          .catch(() => {});
      }
    },
  },
});
