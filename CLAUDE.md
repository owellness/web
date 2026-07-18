# O! Wellness 모노레포

pnpm 워크스페이스 모노레포입니다.

- `apps/web` — Next.js 웹 (콘텐츠 · OWTI · 어드민 · API). 앱별 규칙은 `apps/web/CLAUDE.md` 참조.
- `apps/mobile` — Expo(React Native) 모바일 앱 (예정)
- `packages/shared` — Zod 스키마 · OWTI 채점 · 도메인 로직 공유 패키지 (예정)

명령은 루트에서: `pnpm dev` / `pnpm build` / `pnpm typecheck` / `pnpm lint` (web에 위임).
