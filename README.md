# 오 웰니스 (Oh Wellness)

근거 기반 웰니스 콘텐츠 사이트. 향후 출시될 웰니스 진단·큐레이션·코칭 앱의
오가닉 유저 풀을 확보하기 위해 SEO/AEO/GEO 모두에 최적화된 콘텐츠 허브로
구축되었습니다.

## 기술 스택

- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** + shadcn/ui 스타일 디자인 토큰 + Pretendard 폰트
- **Neon Postgres** + **Drizzle ORM**
- **Auth.js v5** + Resend 매직 링크 (어드민 인증)
- **Tiptap** WYSIWYG 에디터
- **Resend** 이메일 (매직 링크 + 뉴스레터)
- **Vercel** 호스팅 + Vercel Blob (예정)

## 3-Tier 레이어드 아키텍처

```
src/
  app/                              # Tier 1 (Presentation) — Next.js routes
  presentation/                     # Tier 1 — UI components, actions, metadata
  application/                      # Tier 2 — pure business logic, ports, models
    {articles,categories,tags,authors,newsletter,auth,seo}/
  infrastructure/                   # Tier 3 — DB, email, content adapters
    {db,repositories,email,auth,content,cache,storage}/
  composition.ts                    # composition root (wires services + adapters)
  config/site.ts                    # cross-tier static configuration
  proxy.ts                          # Next 16 middleware — admin guard
```

의존성은 단방향(Presentation → Application → Infrastructure는 ports를 통해서만)으로 흐릅니다.
ESLint `import/no-restricted-paths`가 이 경계를 빌드 시 강제합니다.

## 로컬 개발

```bash
# 1) 의존성 설치
pnpm install

# 2) .env.local 만들기
cp .env.example .env.local
# Neon, Auth.js, Resend, ADMIN_EMAILS 값을 채워 넣으세요.

# 3) DB 스키마 적용
pnpm db:push

# 4) 카테고리 시드
pnpm db:seed

# 5) 개발 서버
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.
어드민은 `/admin/login`에서 `ADMIN_EMAILS`에 등록한 이메일로 매직 링크를 받아
로그인합니다.

## Vercel 배포

1. Vercel에서 이 저장소를 import (Framework: Next.js 자동 감지)
2. **Neon Postgres** 통합 추가 → `DATABASE_URL`, `DATABASE_URL_UNPOOLED` 자동 주입
3. **Resend** 계정 생성 후 API key 발급 → 환경변수로 등록
4. 환경변수 추가 (`.env.example` 참고):
   - `AUTH_SECRET` — `openssl rand -base64 32`로 생성
   - `AUTH_URL` — 배포 URL (예: `https://oh-wellness.vercel.app`)
   - `RESEND_API_KEY`, `RESEND_FROM`
   - `ADMIN_EMAILS` — 관리자 이메일(쉼표 구분)
   - `NEXT_PUBLIC_SITE_URL` — 배포 URL
   - `NEWSLETTER_CONFIRM_SECRET` — `openssl rand -base64 32`로 생성
5. 배포 후 `pnpm db:push` (로컬에서 production DATABASE_URL 사용) 또는
   Vercel CLI에서 마이그레이션을 한 번 실행
6. `pnpm db:seed`로 카테고리 4개 시드
7. `/admin/login`에서 관리자 로그인 → `/admin/articles/new`에서 첫 글 발행

## 주요 스크립트

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm typecheck` — TypeScript 검사
- `pnpm lint` — ESLint (3-tier 경계 포함)
- `pnpm db:generate` — Drizzle 마이그레이션 SQL 생성
- `pnpm db:push` — Neon에 스키마 적용
- `pnpm db:studio` — Drizzle Studio
- `pnpm db:seed` — 카테고리 시드

## SEO / AEO / GEO 체크리스트

- [x] Metadata API + canonical + OpenGraph + Twitter card
- [x] JSON-LD: Article/MedicalWebPage, BreadcrumbList, Organization, WebSite, FAQPage, Person
- [x] Dynamic OG image (`/api/og?title=&category=&author=`)
- [x] robots.ts + sitemap.ts (카테고리 + 동적 아티클)
- [x] AEO: TL;DR 박스 + Speakable selector + FAQPage schema
- [ ] llms.txt / llms-full.txt (Week 4)
- [ ] Postgres FTS 검색 (Week 3)
- [ ] Naver Search Advisor 등록 (배포 후)
