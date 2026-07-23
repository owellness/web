import type { OwtiResult } from "@owellness/shared/owti";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

type Props = { result: OwtiResult };

/**
 * OWTI 배지 A — 이모지 칩 (디자인 1k). 홈 인사말 옆, "맞춤" 칩 등 인라인 맥락용.
 * 정체성만 드러내고 영역 정보는 숨긴다.
 */
export function OwtiEmojiChip({ result }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipEmoji}>{result.type.emoji}</Text>
      <Text style={styles.chipCode}>{result.code}</Text>
      <Text style={styles.chipName}>· {result.type.name}</Text>
    </View>
  );
}

/**
 * OWTI 배지 B — 레터 타일 (디자인 1l). 강점(●, 채운 타일) / 취약(○, 빈 타일)
 * 구조가 한눈에 보이는 "설명하는" 맥락용 — 리포트·마이 화면.
 */
export function OwtiLetterTiles({ result }: Props) {
  return (
    <View style={styles.tileRow}>
      {result.scores.map((score) => (
        <View key={score.domain.key} style={styles.tileCol}>
          <View style={[styles.tile, score.isStrong ? styles.tileStrong : styles.tileWeak]}>
            <Text style={[styles.tileLetter, !score.isStrong && styles.tileLetterWeak]}>
              {score.letter}
            </Text>
          </View>
          <Text
            style={[
              styles.tileDomainLabel,
              { color: score.isStrong ? colors.brand : colors.accentDeep },
            ]}
          >
            {score.domain.name.slice(0, 1)} {score.isStrong ? "●" : "○"}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * OWTI 배지 C — 아이덴티티 카드 (디자인 1m). 결과 화면 히어로 겸
 * 인스타 스토리 9:16 공유 카드 (react-native-view-shot으로 캡처 예정, M1).
 */
export function OwtiIdentityCard({ result }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>MY OWTI</Text>
      <Text style={styles.cardEmoji}>{result.type.emoji}</Text>
      <Text style={styles.cardCode}>{result.code}</Text>
      <Text style={styles.cardName}>{result.type.name}</Text>
      <View style={styles.cardPoles}>
        {result.scores.map((score) => (
          <Text
            key={score.domain.key}
            style={[
              styles.cardPole,
              { color: score.isStrong ? colors.accent : "rgba(247,243,236,0.45)" },
            ]}
          >
            {score.domain.name.slice(0, 1)}
            {score.isStrong ? "●" : "○"}
          </Text>
        ))}
      </View>
      <Text style={styles.cardFooter}>오! 웰니스</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // A — emoji chip
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.sm + 5,
    borderRadius: radius.pill,
    backgroundColor: colors.mintTint,
  },
  chipEmoji: { fontSize: 14 },
  chipCode: { fontSize: 13, fontWeight: "800", color: colors.brand, letterSpacing: 0.5 },
  chipName: { fontSize: 12.5, fontWeight: "600", color: colors.textSecondary },

  // B — letter tiles
  tileRow: { flexDirection: "row", gap: spacing.sm },
  tileCol: { width: 50, alignItems: "center" },
  tile: {
    width: 50,
    height: 50,
    borderRadius: radius.md - 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileStrong: { backgroundColor: colors.ink },
  tileWeak: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tileLetter: { fontSize: 20, fontWeight: "700", color: "#f7f3ec" },
  tileLetterWeak: { color: "#bdb5a4" },
  tileDomainLabel: { marginTop: 5, fontSize: 10, fontWeight: "700" },

  // C — identity card (9:16 share card foundation)
  card: {
    width: 180,
    height: 264,
    borderRadius: radius.lg,
    backgroundColor: "#122d24",
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.md + 2,
    alignItems: "center",
  },
  cardKicker: { fontSize: 8.5, fontWeight: "800", letterSpacing: 2, color: colors.accent },
  cardEmoji: { marginTop: spacing.md + 4, fontSize: 40 },
  cardCode: {
    marginTop: spacing.sm + 4,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 6,
    color: "#f7f3ec",
  },
  cardName: { marginTop: 4, fontSize: 13, fontWeight: "600", color: colors.accentTint },
  cardPoles: { marginTop: spacing.sm + 4, flexDirection: "row", gap: spacing.xs + 4 },
  cardPole: { fontSize: 9, fontWeight: "700" },
  cardFooter: {
    marginTop: "auto",
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "rgba(247,243,236,0.5)",
  },
});
