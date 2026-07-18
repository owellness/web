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
  mintTint: "#eaf2ee",
  accent: "#e8a87c",
  accentDeep: "#c0713d",
  textSecondary: "#5b6a62",
  textMuted: "#98a19a",
  tabInactive: "#a9b1aa",
  placeholder: "#b6ae9f",
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
