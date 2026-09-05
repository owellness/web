import { z } from "zod";

export const genderSchema = z.enum([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);
export type Gender = z.infer<typeof genderSchema>;

const isRealPastOrTodayDate = (value: string): boolean => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return date.getTime() <= todayUtc;
};

/** POST /api/v1/auth/email/signup 요청 본문. */
export const emailSignupRequestSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
  gender: genderSchema,
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isRealPastOrTodayDate),
  phone: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^01[016789]\d{7,8}$/)),
});
export type EmailSignupRequest = z.infer<typeof emailSignupRequestSchema>;

/**
 * POST /api/v1/auth/kakao
 * 앱이 카카오 SDK 로그인으로 얻은 액세스 토큰을 보내면,
 * 서버가 카카오 사용자 정보를 검증한 뒤 앱용 Bearer 토큰(JWT)을 발급한다.
 */
export const kakaoLoginRequestSchema = z.object({
  kakaoAccessToken: z.string().min(1),
});
export type KakaoLoginRequest = z.infer<typeof kakaoLoginRequestSchema>;

export const authUserSchema = z.object({
  id: z.uuid(),
  nickname: z.string().nullable(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const kakaoLoginResponseSchema = z.object({
  tokenType: z.literal("Bearer"),
  accessToken: z.string(),
  /** 초 단위 만료 시간 */
  expiresIn: z.number().int().positive(),
  user: authUserSchema,
});
export type KakaoLoginResponse = z.infer<typeof kakaoLoginResponseSchema>;

/** 가입 직후에도 동일한 Bearer 세션을 발급한다. */
export const emailSignupResponseSchema = kakaoLoginResponseSchema;
export type EmailSignupResponse = z.infer<typeof emailSignupResponseSchema>;
