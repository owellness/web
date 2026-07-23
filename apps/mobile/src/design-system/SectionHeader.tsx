import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "./tokens";

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

/** "AFTE를 위한 추천 · 모두 보기" 스타일 섹션 타이틀 (홈 1g, 스토어 1i 등). */
export function OwSectionHeader({ title, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm + 2,
  },
  title: { fontSize: 17, fontWeight: "800", color: colors.ink },
  action: { fontSize: 12.5, fontWeight: "600", color: colors.textMuted },
});
