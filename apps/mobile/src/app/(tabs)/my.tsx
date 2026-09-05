import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OwButton } from "@/design-system";
import { colors, spacing } from "@/design-system/tokens";
import { useAuth } from "@/features/auth/AuthContext";
import {
  isKakaoConfigured,
  loginWithKakao,
  logoutFromKakao,
  type KakaoProfile,
} from "@/features/auth/kakao";

/**
 * 마이 탭 (디자인 2b) 스켈레톤 — 카카오 로그인 연동 데모.
 * 실제 온보딩 게이트(1a·1c)는 M1에서 이 로그인 플로우를 재사용한다.
 */
export default function MyScreen() {
  const { emailSession, logoutEmail } = useAuth();
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
      if (emailSession) {
        logoutEmail();
      } else {
        await logoutFromKakao();
        setProfile(null);
      }
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

        {emailSession || profile ? (
          <>
            <Text style={styles.profile}>
              {emailSession?.user.nickname ?? profile?.nickname ?? "회원"}님
            </Text>
            <OwButton
              label="로그아웃"
              variant="secondary"
              onPress={handleLogout}
              disabled={busy}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <OwButton
              label="이메일로 회원가입"
              onPress={() => router.push("/signup")}
              disabled={busy}
              style={styles.button}
            />
            <Text style={styles.or}>또는</Text>
            <OwButton
              label={busy ? "로그인 중…" : "카카오로 로그인"}
              variant="kakao"
              onPress={handleLogin}
              disabled={busy || !isKakaoConfigured}
              loading={busy}
              style={styles.button}
            />
          </>
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
  or: { color: colors.textMuted, fontSize: 12.5 },
  button: { minWidth: 240 },
  hint: {
    color: colors.textMuted,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 280,
  },
  error: { color: colors.accentDeep, fontSize: 12.5, textAlign: "center" },
});
