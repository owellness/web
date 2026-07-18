import { DOMAINS, TOTAL_QUESTIONS } from "@owellness/shared/owti";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/design-system/tokens";

/**
 * 홈 (디자인 1g — 딥 그린 헤더 + 겹침 카드) 스켈레톤.
 * @owellness/shared 소비 확인을 겸해 OWTI 도메인 데이터를 표시한다.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>오! 웰니스</Text>
          <Text style={styles.heroSub}>
            {DOMAINS.length}개 영역 · {TOTAL_QUESTIONS}문항으로 읽는 나의 웰니스
            유형
          </Text>
        </View>
        {DOMAINS.map((domain) => (
          <View key={domain.key} style={styles.card}>
            <Text style={styles.cardTitle}>{domain.name}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  container: { paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.ink,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: "700",
  },
  heroSub: {
    color: colors.mintTint,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: "600" },
});
