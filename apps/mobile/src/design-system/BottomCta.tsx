import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "./tokens";

type Props = { children: ReactNode };

/**
 * 화면 하단 고정 CTA 바 (검사 진행 1b의 이전/다음, 상품 상세 4b의 구매 바,
 * 예약 플로우 1j의 다음 버튼). 화면 루트에서 Stack 바깥, 최하단에 배치한다.
 */
export function OwBottomCta({ children }: Props) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <View style={styles.row}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs,
  },
});
