import type { ConfigContext, ExpoConfig } from "expo/config";

// 카카오 네이티브 앱 키 — Kakao Developers 콘솔의 값.
// 로컬: apps/mobile/.env 또는 셸 환경변수. EAS 빌드: eas env(또는 secret)로 주입.
const kakaoNativeAppKey =
  process.env.KAKAO_NATIVE_APP_KEY ?? "REPLACE_WITH_KAKAO_NATIVE_APP_KEY";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "O! Wellness",
  slug: config.slug ?? "owellness",
  extra: {
    ...config.extra,
    kakaoNativeAppKey,
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      "@react-native-kakao/core",
      {
        nativeAppKey: kakaoNativeAppKey,
        android: { authCodeHandlerActivity: true },
        ios: { handleKakaoOpenUrl: true },
      },
    ],
  ],
});
