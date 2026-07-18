import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * 카카오 SDK 래퍼.
 * 네이티브 모듈이라 Expo Go·웹에서는 동작하지 않으므로(development build 필요)
 * 전부 dynamic import로 감싸 웹 번들·정적 export를 오염시키지 않는다.
 */

export const kakaoNativeAppKey: string =
  (Constants.expoConfig?.extra?.kakaoNativeAppKey as string | undefined) ?? "";

export const isKakaoConfigured =
  Platform.OS !== "web" &&
  kakaoNativeAppKey !== "" &&
  !kakaoNativeAppKey.startsWith("REPLACE_WITH");

export async function initKakao(): Promise<void> {
  if (!isKakaoConfigured) return;
  const { initializeKakaoSDK } = await import("@react-native-kakao/core");
  await initializeKakaoSDK(kakaoNativeAppKey);
}

export type KakaoProfile = {
  id: number;
  nickname: string;
};

export async function loginWithKakao(): Promise<KakaoProfile> {
  const { login, me } = await import("@react-native-kakao/user");
  await login();
  const profile = await me();
  return { id: profile.id, nickname: profile.nickname ?? "카카오 사용자" };
}

export async function logoutFromKakao(): Promise<void> {
  const { logout } = await import("@react-native-kakao/user");
  await logout();
}
