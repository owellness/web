import type {
  KakaoTokenVerifier,
  KakaoUserInfo,
} from "@/application/appAuth/ports";

const KAKAO_ME_URL = "https://kapi.kakao.com/v2/user/me";

type KakaoMeResponse = {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string };
  };
};

/** 카카오 OpenAPI로 액세스 토큰을 검증하고 프로필을 가져온다. */
export const kakaoOpenApiVerifier: KakaoTokenVerifier = {
  async fetchUser(kakaoAccessToken: string): Promise<KakaoUserInfo> {
    const res = await fetch(KAKAO_ME_URL, {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`kakao /v2/user/me responded ${res.status}`);
    }
    const body = (await res.json()) as KakaoMeResponse;
    if (typeof body.id !== "number") {
      throw new Error("kakao /v2/user/me returned no id");
    }
    return {
      kakaoId: String(body.id),
      nickname: body.kakao_account?.profile?.nickname ?? null,
      email: body.kakao_account?.email ?? null,
    };
  },
};
