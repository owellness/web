/**
 * O! Wellness 디자인 토큰 — 디자인 원본(claude.ai/design "O! Wellness 모바일 앱 디자인")과
 * owellness/app docs/APP_DEVELOPMENT_PLAN.md §4에서 추출한 값.
 */
export const colors = {
  ink: "#1d2b26",
  brand: "#2f6f5e",
  brandDark: "#1d4a3e",
  bg: "#eeece6",
  surface: "#faf9f6",
  surfaceAlt: "#f5f1e8",
  border: "#ebe6dc",
  borderStrong: "#ddd7cb",
  mintTint: "#eaf2ee",
  accent: "#e8a87c",
  accentDeep: "#c0713d",
  accentTint: "#f0d9c4",
  textSecondary: "#5b6a62",
  textMuted: "#98a19a",
  tabInactive: "#a9b1aa",
  placeholder: "#b6ae9f",
  kakaoYellow: "#FEE500",
  kakaoLabel: "#191919",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/**
 * 폰트: 디자인 원본은 Pretendard Variable + 헤드라인 Noto Serif KR.
 * 커스텀 폰트 로딩(expo-font)은 M1에서 온보딩·리포트 화면과 함께 도입 —
 * 그전까지는 시스템 기본 서체로 폴백한다.
 */
export const typography = {
  title: { fontSize: 20, fontWeight: "700" as const },
  heading: { fontSize: 16, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const },
  caption: { fontSize: 12.5, fontWeight: "600" as const },
  label: { fontSize: 11, fontWeight: "700" as const },
} as const;
