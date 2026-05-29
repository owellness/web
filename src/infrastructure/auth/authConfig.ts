import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Resend from "next-auth/providers/resend";

import { createAuthPolicy, type AuthRole } from "@/application/auth/policy";
import { SITE_NAME } from "@/config/site";
import { db } from "@/infrastructure/db/client";
import {
  accounts,
  authSchema,
  sessions,
  users,
  verificationTokens,
} from "@/infrastructure/db/schema";
import { resendMagicLinkSender } from "@/infrastructure/email/magicLinkSender";

// Augment Auth.js types with our role.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AuthRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AuthRole;
  }
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const authPolicy = createAuthPolicy({ adminEmails });

const MAGIC_LINK_TTL_MINUTES = 30;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Trust the deployment host (Vercel sets the URL). Without this, NextAuth
  // can reject the request host and 500 on /api/auth/*.
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: authSchema.usersTable,
    accountsTable: authSchema.accountsTable,
    sessionsTable: authSchema.sessionsTable,
    verificationTokensTable: authSchema.verificationTokensTable,
  }),
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      // Falls back to Resend's shared sender so magic links work before a
      // custom domain is verified. Our sendVerificationRequest below uses
      // RESEND_FROM from resendClient, so this is mainly to satisfy the
      // provider's own config validation.
      from: process.env.RESEND_FROM ?? "오 웰니스 <onboarding@resend.dev>",
      maxAge: MAGIC_LINK_TTL_MINUTES * 60,
      sendVerificationRequest: async ({ identifier, url }) => {
        await resendMagicLinkSender.send({
          to: identifier,
          url,
          brandName: SITE_NAME,
          expiresInMinutes: MAGIC_LINK_TTL_MINUTES,
        });
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login/check-email",
    error: "/admin/login",
  },
  callbacks: {
    async signIn({ user }) {
      return authPolicy.canSignIn(user.email);
    },
    async session({ session, user }) {
      session.user.id = user.id;
      // Derive the role from the admin whitelist on every request rather than
      // trusting the DB column (which defaults to 'viewer' and is never
      // upgraded). This is what lets a whitelisted email actually reach /admin.
      session.user.role = authPolicy.roleFor(user.email);
      return session;
    },
  },
});

export { adminEmails, authPolicy };
// Re-export schema tables so app-level routes (api/auth/[...nextauth]) can stay thin.
export { accounts, sessions, users, verificationTokens };
