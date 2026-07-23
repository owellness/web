import { computeResult, TOTAL_QUESTIONS, type Answers } from "@owellness/shared/owti";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  colors,
  OwBottomCta,
  OwButton,
  OwCard,
  OwChip,
  OwSectionHeader,
  OwToggleRow,
  OwtiEmojiChip,
  OwtiIdentityCard,
  OwtiLetterTiles,
  LikertSelector,
  spacing,
} from "@/design-system";

// 데모용 샘플 응답 — 실천·몸 강점 / 마음·연결 취약(AFTE 근사) 패턴.
const sampleAnswers: Answers = Object.fromEntries(
  Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
    const domainIndex = Math.floor(i / 12); // 0 action 1 fitness 2 calm 3 heart
    return [i + 1, domainIndex < 2 ? 5 : 2];
  }),
);
const sampleResult = computeResult(sampleAnswers);

/**
 * 디자인 시스템 컴포넌트 프리뷰 — 탭에는 없는 개발용 라우트.
 * /design-system-preview 로 직접 진입해 확인한다.
 */
export default function DesignSystemPreview() {
  const [likert, setLikert] = useState<number | null>(null);
  const [chipSelected, setChipSelected] = useState(0);
  const [toggle, setToggle] = useState(true);

  const chips = ["내 유형 맞춤", "수면·스트레스", "운동·홈트"];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>OwtiBadge</Text>
        <OwtiEmojiChip result={sampleResult} />
        <View style={{ height: spacing.md }} />
        <OwCard>
          <OwtiLetterTiles result={sampleResult} />
        </OwCard>
        <View style={{ height: spacing.md }} />
        <View style={styles.dark}>
          <OwtiIdentityCard result={sampleResult} />
        </View>

        <Text style={styles.heading}>OwChip</Text>
        <View style={styles.row}>
          {chips.map((label, i) => (
            <OwChip
              key={label}
              label={label}
              selected={chipSelected === i}
              onPress={() => setChipSelected(i)}
            />
          ))}
        </View>

        <Text style={styles.heading}>OwSectionHeader + OwCard</Text>
        <OwCard>
          <OwSectionHeader title="AFTE를 위한 추천" actionLabel="모두 보기" />
          <Text style={styles.body}>카드 안에 콘텐츠가 이어집니다.</Text>
        </OwCard>

        <Text style={styles.heading}>LikertSelector</Text>
        <LikertSelector value={likert} onChange={setLikert} />

        <Text style={styles.heading}>OwToggleRow</Text>
        <OwCard>
          <OwToggleRow
            title="웰니스 루틴"
            subtitle="매일 아침 8:00"
            value={toggle}
            onValueChange={setToggle}
          />
        </OwCard>

        <Text style={styles.heading}>OwButton</Text>
        <View style={{ gap: spacing.sm }}>
          <OwButton label="다음" variant="primary" onPress={() => {}} />
          <OwButton label="이전" variant="secondary" onPress={() => {}} />
          <OwButton label="카카오로 로그인" variant="kakao" onPress={() => {}} />
        </View>
      </ScrollView>

      <OwBottomCta>
        <OwButton label="이전" variant="secondary" onPress={() => {}} style={{ width: 96 }} />
        <View style={{ flex: 1 }}>
          <OwButton label="다음" variant="primary" onPress={() => {}} />
        </View>
      </OwBottomCta>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  body: { marginTop: spacing.sm, fontSize: 14, color: colors.textSecondary },
  dark: {
    backgroundColor: "#0d231c",
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: "center",
  },
});
