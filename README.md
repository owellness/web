# 오! 웰니스 (O! Wellness)

근거 기반 웰니스 콘텐츠 사이트. 향후 출시될 웰니스 진단·큐레이션·코칭 앱의
오가닉 유저 풀을 확보하기 위해 SEO/AEO/GEO 모두에 최적화된 콘텐츠 허브로
구축되었습니다.

## 기술 스택

- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** + shadcn/ui 스타일 디자인 토큰 + Pretendard 폰트
- **Neon Postgres** + **Drizzle ORM**
- **Auth.js v5** + Credentials 어드민 인증 + Kakao 사용자 인증 (JWT 세션)
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

1. Vercel에서 이 저장소를 import하고 프로젝트 Root Directory를 `apps/web`으로 설정
2. **Neon Postgres** 통합 추가 → `DATABASE_URL`, `DATABASE_URL_UNPOOLED` 자동 주입
3. **Resend** 계정 생성 후 API key 발급 → 환경변수로 등록 (뉴스레터용)
4. 환경변수 추가 (`.env.example` 참고):
   - `AUTH_SECRET` — `openssl rand -base64 32`로 생성
   - `AUTH_URL` — 배포 URL (예: `https://oh-wellness.vercel.app`)
   - `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` — Kakao Developers의 REST API 키·Client Secret
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — 어드민 로그인 아이디·비밀번호
   - (선택) `ADMIN_NAME` / `ADMIN_EMAIL` — 글 작성자 표시용
   - `RESEND_API_KEY`, `RESEND_FROM` — 뉴스레터 발송
   - `NEXT_PUBLIC_SITE_URL` — 배포 URL
   - `NEWSLETTER_CONFIRM_SECRET` — `openssl rand -base64 32`로 생성
5. Kakao Developers의 Redirect URI에 `{AUTH_URL}/api/auth/callback/kakao` 등록
6. 배포 후 `pnpm db:push` (로컬에서 production DATABASE_URL 사용) 또는
   Vercel CLI에서 마이그레이션을 한 번 실행
7. `pnpm db:seed`로 카테고리 4개 시드
8. `/admin/login`에서 관리자 로그인 → `/admin/articles/new`에서 첫 글 발행

## 해외 웰니스 브리핑 자동 번역

홈 화면의 `Global Wellness Briefing`은 NutritionFacts.org, Gowing Life,
Global Wellness Institute의 공식 RSS에서 최신 글을 하루 한 번 수집합니다.
RSS가 제공한 제목·소개문·텍스트 본문과 출처·날짜·원문 링크를 저장하며,
이미지나 임의 HTML은 복제하지 않습니다. Papago 번역이 완료된 항목만
공개합니다. 피드 요청은 ETag와 Last-Modified를 사용하고 출처별 실패를
격리합니다.

운영 설정:

1. `pnpm --filter web db:migrate`로 `external_content_items`,
   `external_feed_states`와 본문 컬럼을 생성. Neon SQL Editor를 쓰는 경우
   신규 DB에는 `apps/web/migrate-0007-external-content.sql` 다음
   `apps/web/migrate-0008-external-content-body.sql`을 실행
2. Vercel에 별도의 강한 `CRON_SECRET`, `PAPAGO_CLIENT_ID`,
   `PAPAGO_CLIENT_SECRET` 등록
3. 출처별 번역·재게시 허락을 확인한 뒤에만
   `EXTERNAL_TRANSLATION_ALLOWED_SOURCES`에 쉼표로 키 추가
   (`nutritionfacts`, `gowinglife`, `gwi`)
4. 배포하면 `apps/web/vercel.json`의 Vercel Cron이 매일 01:00 UTC
   (한국 시간 10:00)에 `/api/cron/wellness-feeds`를 호출

Papago Text Translation은 제목·소개문·RSS 본문을 영어에서 한국어로
번역합니다. 긴 본문은 API 제한보다 작게 나눠 번역한 뒤 순서대로 합칩니다.
화면에는 정책에 따라 `Papago 번역` 표기와 Papago 링크를 노출합니다. 번역
공급자를 변경하면 기존 공급자로 번역된 항목은 다음 동기화에서 숨김·재번역되며,
Papago 번역이 완료된 항목만 다시 공개됩니다.

환경변수가 비어 있거나 허락 목록에서 빠진 출처는 원문을 수집하더라도
`rights_pending` 상태로만 보관되고 홈페이지에는 노출되지 않습니다. 허락을
철회해 목록에서 제거하면 다음 동기화에서 기존 번역도 자동으로 숨겨집니다.
허용 목록에 키를 넣는 것은 해당 피드 전체에 대한 번역·재게시 권한과 필요한
저작자·라이선스 표시 조건을 운영자가 확인했다는 의미입니다.

최초 배포 후 Vercel Cron을 기다리지 않고 확인하려면 `CRON_SECRET`을 Bearer
토큰으로 넣어 `GET /api/cron/wellness-feeds`를 한 번 호출하세요. 응답이 503이면
Vercel Function 로그의 출처별 `errorCode`를 확인하고, 아래 쿼리로 최근 상태를
점검할 수 있습니다.

기존 제목·소개문 데이터에 본문을 처음 채울 때는 먼저 본문 컬럼을 추가하고 새
배포가 Ready인지 확인합니다. 그 다음에만
`apps/web/migrate-0009-external-content-body-backfill.sql`을 실행해 피드 검증자를
초기화하고 Cron을 호출합니다. 실행당 출처별 최대 4개를 처리하므로 현재 대기
건수가 없어질 때까지 여러 번 호출할 수 있습니다. 본문 백필 중에도 기존 카드와
번역 요약은 계속 공개됩니다.

```sql
SELECT source_key,
       count(*) FILTER (WHERE status = 'published') AS published,
       count(*) FILTER (WHERE original_body <> '') AS body_available,
       count(*) FILTER (
         WHERE COALESCE(translated_body, '') <> ''
       ) AS body_translated,
       count(*) FILTER (WHERE translation_error IS NOT NULL) AS translation_errors
FROM external_content_items
GROUP BY source_key
ORDER BY source_key;

SELECT source_key, last_success_at, last_error, consecutive_failures
FROM external_feed_states
ORDER BY source_key;
```

원출처가 글을 철회했거나 권리자가 삭제를 요청하면 해당 원문 URL을 기준으로
영구 숨김 처리합니다. DB에는 즉시 반영되고 홈페이지 ISR 캐시에서는 최대
5분 안에 사라집니다. `withdrawn` 항목은 이후 RSS에 다시 나타나도 자동
재게시되지 않습니다.

```sql
UPDATE external_content_items
SET status = 'withdrawn',
    original_body = '',
    translated_title = NULL,
    translated_excerpt = NULL,
    translated_body = NULL,
    translation_provider = NULL,
    translation_error = NULL,
    translated_at = NULL,
    updated_at = now()
WHERE source_url = 'https://original.example/article';
```

> 번역은 원 저작물의 2차적 이용에 해당할 수 있으므로 기본값은 세 출처 모두
> 비활성입니다. NutritionFacts.org의 일부 자체 제작물에는 CC BY-NC 4.0이
> 표시되지만 비상업성·저작자·라이선스 링크·변경 고지와 개별 권리 확인이
> 필요합니다. 이 자동화는 피드 전체를 처리하므로 세 출처 모두 피드 단위의
> 서면 허락 또는 법률 검토된 이용 근거와 표시 문구를 확정한 뒤 활성화하세요.

## 주요 스크립트

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm typecheck` — TypeScript 검사
- `pnpm lint` — ESLint (3-tier 경계 포함)
- `pnpm db:generate` — Drizzle 마이그레이션 SQL 생성
- `pnpm db:push` — Neon에 스키마 적용
- `pnpm db:studio` — Drizzle Studio
- `pnpm db:seed` — 카테고리·FAQ·소개 페이지 시드
- `pnpm --filter web cards:generate` — OWTI 16개 유형별 카드 이미지 재생성

## OWTI 유형별 카드 이미지

`apps/web/public/owti/cards/owti-<code>.jpg` — 16개 유형의 범용 홍보 카드(1080×1350,
인스타그램 4:5)입니다. 결과 페이지에서 방문자가 받는 **개인** 공유 카드
(`src/presentation/lib/owtiShareCard.ts`, 본인 점수 표시)와는 별개로, 운영자가
마케팅·소셜용으로 쓰는 유형별 이미지입니다.

유형 문구(`packages/shared/src/owti/types.ts`)나 카드 디자인이 바뀌면 재생성하세요:

```bash
# playwright-core는 브라우저를 내려받지 않으므로 설치된 Chrome/Edge를 지정
CHROMIUM_PATH="/path/to/chrome" pnpm --filter web cards:generate
```

기본 출력은 JPEG(품질 0.92)로 16장 합계 약 1.2MB입니다. 무손실이 필요하면
`CARD_FORMAT=png`(장당 약 1.2MB), 더 작게 하려면 `CARD_FORMAT=webp`를 쓰세요.

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
- [x] Naver Search Advisor 소유확인 (메타 태그 + HTML 파일 둘 다 코드에 내장)

## Naver Search Advisor 등록

소유확인은 **이미 코드에 내장**되어 있습니다 (두 방식 모두 지원, 둘 중 하나만으로 확인됨):

- **메타 태그** — 루트 레이아웃이 `<meta name="naver-site-verification" content="…">`를
  자동 출력. 토큰 기본값은 `src/config/site.ts`에 하드코딩(소유확인 토큰은 공개 값),
  필요 시 `NAVER_SITE_VERIFICATION` 환경변수로 덮어쓰기.
- **HTML 파일** (네이버 권장) — `/naverbe02a68c6d0d7362915cfef770a08910.html` 라우트 핸들러가
  확인 파일을 서빙 (`public/` 디렉터리가 없어 `robots.txt`·`sitemap.xml`·`llms.txt`와 동일하게 처리).

배포 후:

1. https://searchadvisor.naver.com/ 접속 → 사이트 등록(`https://www.owellness.co.kr`)
2. 소유 확인 → **HTML 파일** 또는 **HTML 태그** 중 하나 선택 → **[소유확인]** 클릭
3. 등록 후 **사이트맵 제출** → `https://<domain>/sitemap.xml`
4. RSS는 (아직) 없으므로 생략. 모바일 가이드라인 자동 통과

> 네이버가 토큰을 재발급하면 `src/config/site.ts`의 기본값(또는 `NAVER_SITE_VERIFICATION`)과
> `src/app/naver….html/route.ts`의 파일명·본문을 새 값으로 교체하세요.

## LLM 인용을 위한 GEO 엔드포인트

- `https://<domain>/llms.txt` — 사이트 개요 + 카테고리 + 발행 아티클 인덱스
- `https://<domain>/llms-full.txt` — 모든 발행 아티클 본문(plain text)
- 캐시: 10분 ISR, AI 크롤러는 `robots.ts`에 명시적으로 허용
