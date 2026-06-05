# 오 웰니스 (Oh Wellness)

근거 기반 웰니스 콘텐츠 사이트. 향후 출시될 웰니스 진단·큐레이션·코칭 앱의
오가닉 유저 풀을 확보하기 위해 SEO/AEO/GEO 모두에 최적화된 콘텐츠 허브로
구축되었습니다.

## 기술 스택

- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** + shadcn/ui 스타일 디자인 토큰 + Pretendard 폰트
- **Neon Postgres** + **Drizzle ORM**
- **Auth.js v5** + Credentials(아이디/비밀번호) 어드민 인증 (JWT 세션)
- **Tiptap** WYSIWYG 에디터
- **Resend** 이메일 (뉴스레터)
- **Vercel** 호스팅 + Vercel Blob (예정)

## 3-Tier 레이어드 아키텍처

```
src/
  app/                              # Tier 1 (Presentation) — Next.js routes
  presentation/                     # Tier 1 — UI components, actions, metadata
  application/                      # Tier 2 — pure business logic, ports, models
    {articles,categories,tags,authors,newsletter,faq,pages,auth,seo}/
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
# Neon, AUTH_SECRET, ADMIN_USERNAME/ADMIN_PASSWORD, Resend 값을 채워 넣으세요.

# 3) DB 스키마 적용
pnpm db:push

# 4) 카테고리 시드
pnpm db:seed

# 5) 개발 서버
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.
어드민은 `/admin/login`에서 `ADMIN_USERNAME` / `ADMIN_PASSWORD`로 로그인합니다.

## Vercel 배포

1. Vercel에서 이 저장소를 import (Framework: Next.js 자동 감지)
2. **Neon Postgres** 통합 추가 → `DATABASE_URL`, `DATABASE_URL_UNPOOLED` 자동 주입
3. **Resend** 계정 생성 후 API key 발급 → 환경변수로 등록 (뉴스레터용)
4. 환경변수 추가 (`.env.example` 참고):
   - `AUTH_SECRET` — `openssl rand -base64 32`로 생성
   - `AUTH_URL` — 배포 URL (예: `https://oh-wellness.vercel.app`)
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — 어드민 로그인 아이디·비밀번호
   - (선택) `ADMIN_NAME` / `ADMIN_EMAIL` — 글 작성자 표시용
   - `RESEND_API_KEY`, `RESEND_FROM` — 뉴스레터 발송
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
- `pnpm db:seed` — 카테고리·FAQ·소개 페이지 시드

## SEO / AEO / GEO 체크리스트

- [x] Metadata API + canonical + OpenGraph + Twitter card
- [x] JSON-LD: Article/MedicalWebPage, BreadcrumbList, Organization, WebSite, FAQPage, Person, Speakable
- [x] Dynamic OG image (`/api/og?title=&category=&author=`)
- [x] robots.ts (AI 크롤러 명시 allow) + sitemap.ts (카테고리·아티클·태그)
- [x] AEO: TL;DR 박스 + Speakable selector + 질문형 H2 자동 FAQPage
- [x] GEO: `/llms.txt` 인덱스 + `/llms-full.txt` 전체 본문 (llmstxt.org 스펙)
- [x] Postgres FTS — es-hangul 자모·초성 매칭
- [x] Vercel Analytics + Speed Insights + GA4 (Consent Mode v2, 쿠키리스)
- [x] 의료 면책 컴포넌트 (`MedicalDisclaimer`)
- [ ] Naver Search Advisor 등록 (배포 후 수동)

## Naver Search Advisor 등록

1. https://searchadvisor.naver.com/ 접속 → 사이트 등록
2. 소유 확인 → **HTML 태그** 선택 → `content` 값 복사
3. Vercel 환경변수에 `NAVER_SITE_VERIFICATION=값` 추가하고 재배포
4. 등록 후 **사이트맵 제출** → `https://<domain>/sitemap.xml`
5. RSS는 (아직) 없으므로 생략. 모바일 가이드라인 자동 통과

## LLM 인용을 위한 GEO 엔드포인트

- `https://<domain>/llms.txt` — 사이트 개요 + 카테고리 + 발행 아티클 인덱스
- `https://<domain>/llms-full.txt` — 모든 발행 아티클 본문(plain text)
- 캐시: 10분 ISR, AI 크롤러는 `robots.ts`에 명시적으로 허용
