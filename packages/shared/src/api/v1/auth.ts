import { z } from "zod";

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
