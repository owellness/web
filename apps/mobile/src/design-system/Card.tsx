import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing } from "./tokens";

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

/** 공통 카드 컨테이너 — 리포트(1d)·홈(1g)·상세 화면의 흰 카드. */
export function OwCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
