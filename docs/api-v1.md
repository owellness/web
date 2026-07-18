# O! Wellness 모바일 앱 API v1

계약(요청·응답 스키마)의 단일 소스는 **`@owellness/shared/api/v1`** (Zod)이다.
서버(`apps/web`의 Route Handler)와 앱(`apps/mobile`)이 같은 스키마를 import한다 — 이 문서는 개요이며, 스키마가 우선한다.

공통 사항

- Base path: `/api/v1`
- 오류: 모든 실패는 `{ "error": { "code", "message" } }` 봉투 (`apiErrorSchema`). code ∈ `VALIDATION_FAILED(400)` · `UNAUTHORIZED(401)` · `FORBIDDEN(403)` · `NOT_FOUND(404)` · `RATE_LIMITED(429)` · `INTERNAL(500)`
- 인증: `Authorization: Bearer <JWT>` — HS256, 만료 14일 (v1은 리프레시 토큰 없음, v1.1 도입 예정)
- 서버 환경변수: `APP_JWT_SECRET`

## POST /api/v1/auth/kakao — 카카오 로그인

앱이 카카오 SDK 로그인으로 얻은 **카카오 액세스 토큰**을 보내면, 서버가 카카오 OpenAPI(`/v2/user/me`)로 검증한 뒤 사용자를 upsert하고 앱용 Bearer 토큰을 발급한다.

- 요청: `{ "kakaoAccessToken": string }`
- 응답 200: `{ "tokenType": "Bearer", "accessToken": string, "expiresIn": number, "user": { "id": uuid, "nickname": string|null } }`
- 사용자 저장: 기존 Auth.js `users` + `accounts`(provider `"kakao"`) 테이블 재사용. 카카오가 이메일을 주지 않으면 합성 이메일(`kakao-{id}@users.noreply.owellness.kr`)로 저장

## POST /api/v1/owti/results — 검사 결과 제출 (Bearer)

- 요청: `{ "answers": { "1": 1..5, …, "48": 1..5 } }` — 48문항 전체 필수
- **채점은 서버가 `@owellness/shared/owti`의 `computeResult`로 재계산** — 클라이언트 점수는 받지 않는다
- 응답 201: `{ "id", "typeCode": "AFCH" 등 4글자, "domainAverages": { action, fitness, calm, heart }, "createdAt" }`
- 원시 응답(answers)도 저장 — 채점 로직 개정 시 히스토리 재채점 가능

## GET /api/v1/owti/results — 결과 히스토리 (Bearer)

- 응답 200: `{ "items": OwtiResultDto[] }` — 최신순, 최대 50건

## GET /api/v1/articles — 아티클 피드 (공개)

- 쿼리: `limit`(1–50, 기본 20) · `cursor`(이전 응답의 nextCursor) · `category`(슬러그) · `sort`(`latest`|`popular`)
- 응답 200: `{ "items": ArticleFeedItem[], "nextCursor": string|null }`

## v1.1 후보 (미구현)

- 리프레시 토큰 회전 / 로그아웃(토큰 폐기)
- 게스트 검사 결과의 로그인 시 병합
- 숏폼 피드, 저장한 콘텐츠, 코칭·스토어 도메인 (계획서 §5 참조)
