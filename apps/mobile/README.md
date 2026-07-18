# O! Wellness Mobile (Expo)

O! Wellness 모바일 앱 — Expo Router 기반 5탭(홈·콘텐츠·코칭·스토어·마이) 스켈레톤.

```bash
pnpm install          # 모노레포 루트에서
cd apps/mobile
pnpm start            # Expo dev server
pnpm typecheck
```

- 공유 도메인 로직: `@owellness/shared` (OWTI 문항·채점)
- 디자인 토큰: `src/design-system/tokens.ts`
- 네이티브 모듈(카카오 SDK 등) 추가 후에는 development build 필요: `eas build --profile development`

## 카카오 로그인

1. [Kakao Developers](https://developers.kakao.com)에서 앱 등록 후 **네이티브 앱 키** 발급
2. 플랫폼 등록: Android 패키지명 `kr.owellness.app`(키 해시 포함), iOS 번들 ID `kr.owellness.app`
3. 로컬: `.env`에 `KAKAO_NATIVE_APP_KEY` 설정 · EAS: `eas env:create`로 주입
4. 네이티브 모듈이므로 Expo Go에서는 동작하지 않음 — `eas build --profile development` 후 dev client에서 테스트
