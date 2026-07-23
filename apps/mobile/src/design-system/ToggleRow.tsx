import { StyleSheet, Switch, Text, View } from "react-native";

import { colors, spacing } from "./tokens";

type Props = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

/** 알림 설정(3d)의 토글 행. */
export function OwToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.brand }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14.5, fontWeight: "600", color: colors.ink },
  subtitle: { fontSize: 12, color: colors.textMuted },
});
