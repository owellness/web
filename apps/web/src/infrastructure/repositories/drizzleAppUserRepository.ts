import { and, eq, sql } from "drizzle-orm";

import type {
  AppUser,
  AppUserRepository,
  EmailUserInfo,
  KakaoUserInfo,
} from "@/application/appAuth/ports";

import { db } from "@/infrastructure/db/client";
import { accounts, users } from "@/infrastructure/db/schema";

const KAKAO_PROVIDER = "kakao";

const isUniqueViolation = (error: unknown): boolean => {
  const visited = new Set<object>();
  let current = error;

  while (typeof current === "object" && current !== null && !visited.has(current)) {
    visited.add(current);
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }

  return false;
};

// users.email is NOT NULL UNIQUE (Auth.js schema). Kakao may not provide an
// email, so absent ones get a synthetic, deterministic placeholder.
const emailFor = (info: KakaoUserInfo): string =>
  (
    info.email ?? `kakao-${info.kakaoId}@users.noreply.owellness.kr`
  ).toLowerCase();

export const drizzleAppUserRepository: AppUserRepository = {
  async upsertKakaoUser(info: KakaoUserInfo): Promise<AppUser> {
    const [existing] = await db
      .select({ id: users.id, name: users.name })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(
        and(
          eq(accounts.provider, KAKAO_PROVIDER),
          eq(accounts.providerAccountId, info.kakaoId),
        ),
      )
      .limit(1);
    if (existing) return existing;

    const [user] = await db
      .insert(users)
      .values({ name: info.nickname, email: emailFor(info) })
      .returning({ id: users.id, name: users.name });

    await db.insert(accounts).values({
      userId: user.id,
      type: "oauth",
      provider: KAKAO_PROVIDER,
      providerAccountId: info.kakaoId,
    });

    return user;
  },

  async createEmailUser(info: EmailUserInfo): Promise<AppUser | null> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          name: info.name,
          email: info.email,
          passwordHash: info.passwordHash,
          gender: info.gender,
          birthDate: info.birthDate,
          phone: info.phone,
        })
        .returning({ id: users.id, name: users.name });
      return user;
    } catch (error) {
      // PostgreSQL unique_violation. 이메일/전화번호 중복은 가입 충돌로 통일한다.
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  async findById(id: string): Promise<AppUser | null> {
    const [row] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ?? null;
  },

  async findByEmail(email: string): Promise<AppUser | null> {
    const [row] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return row ?? null;
  },
};
