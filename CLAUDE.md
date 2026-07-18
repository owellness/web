# O! Wellness 모노레포

pnpm 워크스페이스 모노레포입니다.

- `apps/web` — Next.js 웹 (콘텐츠 · OWTI · 어드민 · API). 앱별 규칙은 `apps/web/CLAUDE.md` 참조.
- `apps/mobile` — Expo(React Native) 모바일 앱 (예정)
- `packages/shared` — 웹·모바일 공유 도메인 패키지 (`@owellness/shared`) — OWTI 문항·채점·유형 로직

명령은 루트에서: `pnpm dev` / `pnpm build` / `pnpm typecheck` / `pnpm lint` (web에 위임).
