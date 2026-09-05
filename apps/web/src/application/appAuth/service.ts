import {
  emailSignupRequestSchema,
  type EmailSignupResponse,
  kakaoLoginRequestSchema,
  type KakaoLoginResponse,
} from "@owellness/shared/api/v1";

import { ApplicationError } from "@/application/shared/errors";

import type {
  AppTokenIssuer,
  AppUserRepository,
  KakaoTokenVerifier,
  PasswordHasher,
} from "./ports";

export type AppAuthServiceDeps = {
  verifier: KakaoTokenVerifier;
  users: AppUserRepository;
  tokens: AppTokenIssuer;
  passwords: PasswordHasher;
};

export const createAppAuthService = ({
  verifier,
  users,
  tokens,
  passwords,
}: AppAuthServiceDeps) => ({
  /** 이메일 계정 생성 → 앱 Bearer 토큰 발급. */
  async signupWithEmail(rawInput: unknown): Promise<EmailSignupResponse> {
    const parsed = emailSignupRequestSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ApplicationError("VALIDATION_FAILED", "invalid request body");
    }

    const { password, ...profile } = parsed.data;
    const passwordHash = await passwords.hash(password);
    const user = await users.createEmailUser({
      ...profile,
      passwordHash,
    });
    if (!user) {
      throw new ApplicationError(
        "ALREADY_EXISTS",
        "email or phone number is already registered",
      );
    }

    const issued = await tokens.issue(user.id);
    return {
      tokenType: "Bearer",
      accessToken: issued.accessToken,
      expiresIn: issued.expiresIn,
      user: { id: user.id, nickname: user.name },
    };
  },

  /** 카카오 액세스 토큰 → 사용자 upsert → 앱 Bearer 토큰 발급. */
  async loginWithKakao(rawInput: unknown): Promise<KakaoLoginResponse> {
    const parsed = kakaoLoginRequestSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ApplicationError("VALIDATION_FAILED", "invalid request body");
    }

    let info;
    try {
      info = await verifier.fetchUser(parsed.data.kakaoAccessToken);
    } catch (e) {
      throw new ApplicationError(
        "UNAUTHORIZED",
        "kakao access token verification failed",
        e,
      );
    }

    const user = await users.upsertKakaoUser(info);
    const issued = await tokens.issue(user.id);
    return {
      tokenType: "Bearer",
      accessToken: issued.accessToken,
      expiresIn: issued.expiresIn,
      user: { id: user.id, nickname: user.name },
    };
  },

  /** Authorization 헤더의 Bearer 토큰을 검증해 userId를 돌려준다. */
  async authenticate(authorizationHeader: string | null): Promise<string> {
    const token = authorizationHeader?.match(/^Bearer (.+)$/)?.[1];
    if (!token) {
      throw new ApplicationError("UNAUTHORIZED", "missing bearer token");
    }
    const userId = await tokens.verify(token);
    if (!userId) {
      throw new ApplicationError("UNAUTHORIZED", "invalid or expired token");
    }
    return userId;
  },
});

export type AppAuthService = ReturnType<typeof createAppAuthService>;
