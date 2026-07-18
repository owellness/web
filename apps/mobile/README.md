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
