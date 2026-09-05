/** 카카오 OpenAPI에서 확인한 사용자 정보. */
export type KakaoUserInfo = {
  /** 카카오 회원번호 (id) — accounts.providerAccountId로 저장 */
  kakaoId: string;
  nickname: string | null;
  email: string | null;
};

/** 카카오 액세스 토큰을 검증하고 사용자 정보를 가져온다. 실패 시 throw. */
export interface KakaoTokenVerifier {
  fetchUser(kakaoAccessToken: string): Promise<KakaoUserInfo>;
}

export type AppUser = {
  id: string;
  name: string | null;
};

/** provider="kakao" 계정 기준으로 사용자를 찾거나 생성한다. */
export interface AppUserRepository {
  upsertKakaoUser(info: KakaoUserInfo): Promise<AppUser>;
  findById(id: string): Promise<AppUser | null>;
  findByEmail(email: string): Promise<AppUser | null>;
}

export type IssuedToken = {
  accessToken: string;
  /** 초 단위 만료 */
  expiresIn: number;
};

/** 모바일 앱용 Bearer 토큰 발급·검증. */
export interface AppTokenIssuer {
  issue(userId: string): Promise<IssuedToken>;
  /** 유효하면 userId, 아니면 null. */
  verify(token: string): Promise<string | null>;
}
