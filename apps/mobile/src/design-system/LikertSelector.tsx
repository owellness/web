import { LIKERT_OPTIONS } from "@owellness/shared/owti";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

type Props = {
  value: number | null;
  onChange: (value: number) => void;
};

/**
 * OWTI 검사(1b)의 리커트 5점 선택지. 문항 라벨은 @owellness/shared/owti의
 * LIKERT_OPTIONS(웹 검사와 동일 문구)를 단일 소스로 사용한다.
 */
export function LikertSelector({ value, onChange }: Props) {
  return (
    <View style={styles.list}>
      {LIKERT_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <View style={[styles.dot, selected && styles.dotSelected]} />
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md - 2,
    height: 58,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.lg - 4,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  dotSelected: {
    borderWidth: 6,
    borderColor: colors.accent,
  },
  label: { fontSize: 15, fontWeight: "500", color: colors.ink },
  labelSelected: { fontWeight: "700", color: colors.surface },
});
