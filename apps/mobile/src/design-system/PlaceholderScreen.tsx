import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/design-system/tokens";

type Props = { title: string; designRef: string };

/** 미구현 탭의 임시 화면. designRef는 디자인 화면 ID(예: "2a"). */
export function PlaceholderScreen({ title, designRef }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>디자인 {designRef} 구현 예정</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
});
