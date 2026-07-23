import {
  computeResult,
  DOMAINS,
  TOTAL_QUESTIONS,
  type Answers,
} from "@owellness/shared/owti";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OwCard, OwSectionHeader, OwtiEmojiChip } from "@/design-system";
import { colors, spacing } from "@/design-system/tokens";

// TODO(M1): 로그인 사용자의 실제 최신 결과로 교체 (GET /api/v1/owti/results).
const sampleAnswers: Answers = Object.fromEntries(
  Array.from({ length: TOTAL_QUESTIONS }, (_, i) => [
    i + 1,
    Math.floor(i / 12) < 2 ? 5 : 2,
  ]),
);
const sampleResult = computeResult(sampleAnswers);

/**
 * 홈 (디자인 1g — 딥 그린 헤더 + 겹침 카드) 스켈레톤.
 * 디자인 시스템 컴포넌트(OwtiBadge·OwCard·OwSectionHeader) 소비 확인을 겸한다.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <OwtiEmojiChip result={sampleResult} />
          <Text style={styles.heroTitle}>지수님, 오늘도 가볍게 시작해요</Text>
          <Text style={styles.heroSub}>
            {DOMAINS.length}개 영역 · {TOTAL_QUESTIONS}문항으로 읽는 나의 웰니스
            유형
          </Text>
        </View>

        <View style={styles.cards}>
          <OwCard>
            <OwSectionHeader title="영역" actionLabel="모두 보기" />
            {DOMAINS.map((domain) => (
              <Text key={domain.key} style={styles.domainRow}>
                {domain.name}
              </Text>
            ))}
          </OwCard>
        </View>
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
    gap: spacing.sm + 2,
  },
  heroTitle: { color: colors.surface, fontSize: 22, fontWeight: "700" },
  heroSub: { color: colors.mintTint, fontSize: 13 },
  cards: { paddingHorizontal: spacing.md, marginTop: -spacing.lg, gap: spacing.sm },
  domainRow: {
    color: colors.ink,
    fontSize: 14.5,
    fontWeight: "600",
    paddingVertical: spacing.xs + 2,
  },
});
