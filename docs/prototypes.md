# 디자인 프로토타입 호스팅

Claude Design 익스포트를 별도 배포 없이 **웹 앱과 같은 도메인의 URL**로 열어보기
위한 얇은 호스트입니다. 프로덕션 코드로 옮기기 전, 디자인 원본 그대로를 링크로
공유하고 리뷰하는 용도입니다.

## 등록 방법

1. Claude Design 프로젝트에서 파일을 내려받습니다. 캔버스 파일(`*.dc.html`)과
   그 파일이 import 하는 모든 형제 파일(예: `ios-frame.jsx`, `support.js`,
   이미지)을 함께 받아야 합니다.
2. 받은 파일을 그대로 `apps/web/public/prototypes/` 에 넣습니다. 파일 이름은
   바꾸지 마세요 — 익스포트가 상대 경로(`./support.js`)로 서로를 참조합니다.
3. 커밋 후 배포하면 끝입니다.

```
apps/web/public/prototypes/
├─ O Wellness UI.dc.html   → /prototype/o-wellness-ui
├─ ios-frame.jsx
└─ support.js
```

## URL

| 경로 | 내용 |
| --- | --- |
| `/prototype` | 등록된 프로토타입 목록 |
| `/prototype/<slug>` | 뷰어 — 캔버스 / 모바일 390 / 태블릿 834 폭 전환 |
| `/prototypes/<파일명>` | 익스포트 원본 (정적 파일) |

슬러그는 파일 이름에서 `.dc.html` 을 뗀 뒤 소문자 하이픈으로 변환한 값입니다.

## 동작 방식

- 익스포트는 `public/` 에 있는 **정적 파일**이라 브라우저가 그대로 받아갑니다.
  덕분에 익스포트 내부의 상대 경로 import 가 아무 변환 없이 해결됩니다.
- `/prototype` 과 `/prototype/[slug]` 는 요청 데이터를 읽지 않으므로 빌드
  시점에 프리렌더됩니다. 목록을 만드는 `fs` 스캔이 빌드 때만 실행되는 이유이며
  (`_lib/registry.ts`), 서버리스 런타임에서는 `public/` 을 읽지 않습니다.
- 뷰어는 익스포트를 `sandbox` iframe 안에서 렌더링합니다. 디자인 코드가 호스트
  페이지를 조작하거나 앱 쿠키에 접근하지 못하게 하기 위함입니다.
- `robots.ts` 가 `/prototype` 을 색인에서 제외하고, 각 페이지도 `noindex` 입니다.
