import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "./tokens";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** 필터·카테고리 칩 (콘텐츠 탭 2a, 코칭 탭 1h의 역할·지역 칩). */
export function OwChip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md - 2,
  },
  selected: { backgroundColor: colors.brand },
  unselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: "600" },
  labelSelected: { color: colors.surface },
  labelUnselected: { color: colors.textSecondary },
});
