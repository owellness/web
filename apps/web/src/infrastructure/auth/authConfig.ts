import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Kakao, { type KakaoProfile } from "next-auth/providers/kakao";

import { createCredentialPolicy, type AuthRole } from "@/application/auth/policy";
import { ensureAdminUser } from "@/infrastructure/auth/adminUser";
import { drizzleAppUserRepository } from "@/infrastructure/repositories/drizzleAppUserRepository";

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

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME ?? "").trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? `${ADMIN_USERNAME || "admin"}@admin.local`
).toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME ?? "관리자";

const credentialPolicy = createCredentialPolicy({
  username: ADMIN_USERNAME,
  password: ADMIN_PASSWORD,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Trust the deployment host (Vercel sets the URL). Without this, NextAuth
  // can reject the request host and 500 on /api/auth/*.
  trustHost: true,
  // Credentials provider requires the JWT session strategy.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      authorize: async (credentials) => {
        const ok = credentialPolicy.verify({
          username: credentials?.username as string | undefined,
          password: credentials?.password as string | undefined,
        });
        if (!ok) return null;

        // Keep a stable users row so article authorship FK stays valid.
        const user = await ensureAdminUser({
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: "admin" as const,
        };
      },
    }),
    Kakao({
      async profile(profile: KakaoProfile) {
        const kakaoId = String(profile.id);
        const nickname = profile.kakao_account?.profile?.nickname ?? null;
        const email = profile.kakao_account?.email ?? null;
        const user = await drizzleAppUserRepository.upsertKakaoUser({
          kakaoId,
          nickname,
          email,
        });

        return {
          id: user.id,
          name: user.name ?? nickname,
          email: email ?? `kakao-${kakaoId}@users.noreply.owellness.kr`,
          image: profile.kakao_account?.profile?.profile_image_url ?? null,
          role: "viewer" as const,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    // Auth.js appends its own `?error=...` query string. Keeping this URL
    // query-free avoids malformed redirects such as `?authError=1?error=...`.
    error: "/owti/test",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role =
          (user as { role?: AuthRole }).role ??
          (account?.provider === "credentials" ? "admin" : "viewer");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as AuthRole) ?? "viewer";
      }
      return session;
    },
  },
});
