import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  isKakaoConfigured,
  loginWithKakao,
  logoutFromKakao,
  type KakaoProfile,
} from "@/features/auth/kakao";
import { colors, radius, spacing } from "@/design-system/tokens";

/**
 * 마이 탭 (디자인 2b) 스켈레톤 — 카카오 로그인 연동 데모.
 * 실제 온보딩 게이트(1a·1c)는 M1에서 이 로그인 플로우를 재사용한다.
 */
export default function MyScreen() {
  const [profile, setProfile] = useState<KakaoProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      setProfile(await loginWithKakao());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logoutFromKakao();
      setProfile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.body}>
        <Text style={styles.title}>마이</Text>

        {profile ? (
          <>
            <Text style={styles.profile}>
              {profile.nickname}님 (id: {profile.id})
            </Text>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleLogout}
              disabled={busy}
            >
              <Text style={styles.buttonSecondaryLabel}>로그아웃</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.button, styles.buttonKakao]}
            onPress={handleLogin}
            disabled={busy || !isKakaoConfigured}
          >
            <Text style={styles.buttonKakaoLabel}>
              {busy ? "로그인 중…" : "카카오로 로그인"}
            </Text>
          </Pressable>
        )}

        {!isKakaoConfigured && (
          <Text style={styles.hint}>
            KAKAO_NATIVE_APP_KEY 미설정 상태예요. 키 설정 후 development
            build에서 동작합니다. (Expo Go·웹 미지원)
          </Text>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  profile: { color: colors.textSecondary, fontSize: 15 },
  button: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minWidth: 240,
    alignItems: "center",
  },
  buttonKakao: { backgroundColor: "#FEE500" },
  buttonKakaoLabel: { color: "#191919", fontSize: 15, fontWeight: "600" },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryLabel: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  hint: {
    color: colors.textMuted,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 280,
  },
  error: { color: colors.accentDeep, fontSize: 12.5, textAlign: "center" },
});
