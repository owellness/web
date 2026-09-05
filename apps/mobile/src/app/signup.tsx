import {
  emailSignupRequestSchema,
  type EmailSignupRequest,
  type Gender,
} from "@owellness/shared/api/v1";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OwButton } from "@/design-system";
import { colors, radius, spacing } from "@/design-system/tokens";
import { useAuth } from "@/features/auth/AuthContext";
import { privacyPolicyUrl } from "@/features/auth/email";

type FormValues = Record<keyof EmailSignupRequest, string> & {
  passwordConfirm: string;
};
type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  gender: "",
  birthDate: "",
  phone: "",
};

const genderOptions: { value: Gender; label: string }[] = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "기타" },
  { value: "prefer_not_to_say", label: "선택 안 함" },
];

const fieldMessages: Record<keyof EmailSignupRequest, string> = {
  name: "이름은 2~50자로 입력해 주세요.",
  email: "올바른 이메일 주소를 입력해 주세요.",
  password: "비밀번호는 영문과 숫자를 포함해 8자 이상 입력해 주세요.",
  gender: "성별을 선택해 주세요.",
  birthDate: "실제 생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.",
  phone: "올바른 휴대전화 번호를 입력해 주세요.",
};

const formatDate = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)]
    .filter(Boolean)
    .join("-");
};

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
};

function FormField({ label, error, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, error && styles.inputError]}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export default function SignupScreen() {
  const { signup } = useAuth();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const parsed = emailSignupRequestSchema.safeParse(values);
    const nextErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && field in fieldMessages) {
          nextErrors[field as keyof EmailSignupRequest] =
            fieldMessages[field as keyof EmailSignupRequest];
        }
      }
    }
    if (values.password !== values.passwordConfirm) {
      nextErrors.passwordConfirm = "비밀번호가 일치하지 않아요.";
    }
    if (Object.keys(nextErrors).length > 0 || !parsed.success) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    setSubmitError(null);
    try {
      await signup(parsed.data);
      router.replace("/(tabs)/my");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했어요.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>

          <Text style={styles.title}>이메일로 시작하기</Text>
          <Text style={styles.subtitle}>
            기본 정보를 입력하면 바로 오! 웰니스를 시작할 수 있어요.
          </Text>

          <View style={styles.form}>
            <FormField
              label="이름"
              value={values.name}
              onChangeText={(value) => update("name", value)}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="홍길동"
              error={errors.name}
            />
            <FormField
              label="이메일"
              value={values.email}
              onChangeText={(value) => update("email", value)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              placeholder="hello@example.com"
              error={errors.email}
            />
            <FormField
              label="비밀번호"
              value={values.password}
              onChangeText={(value) => update("password", value)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              secureTextEntry
              placeholder="영문과 숫자를 포함한 8자 이상"
              error={errors.password}
            />
            <FormField
              label="비밀번호 확인"
              value={values.passwordConfirm}
              onChangeText={(value) => update("passwordConfirm", value)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              secureTextEntry
              placeholder="비밀번호를 한 번 더 입력해 주세요"
              error={errors.passwordConfirm}
            />

            <View style={styles.field}>
              <Text style={styles.label}>성별</Text>
              <View style={styles.genderRow}>
                {genderOptions.map((option) => {
                  const selected = values.gender === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => update("gender", option.value)}
                      style={[styles.genderChip, selected && styles.genderSelected]}
                    >
                      <Text
                        style={[
                          styles.genderLabel,
                          selected && styles.genderSelectedLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.gender && (
                <Text style={styles.fieldError}>{errors.gender}</Text>
              )}
            </View>

            <FormField
              label="생년월일"
              value={values.birthDate}
              onChangeText={(value) => update("birthDate", formatDate(value))}
              keyboardType="number-pad"
              placeholder="YYYY-MM-DD"
              maxLength={10}
              error={errors.birthDate}
            />
            <FormField
              label="전화번호"
              value={values.phone}
              onChangeText={(value) => update("phone", formatPhone(value))}
              autoComplete="tel"
              keyboardType="phone-pad"
              placeholder="010-1234-5678"
              maxLength={13}
              error={errors.phone}
            />
          </View>

          <Text style={styles.privacy}>
            입력한 정보는 계정 생성과 맞춤형 웰니스 서비스 제공에 사용됩니다. 자세한
            내용은{` `}
            <Text
              accessibilityRole="link"
              onPress={() => Linking.openURL(privacyPolicyUrl)}
              style={styles.privacyLink}
            >
              개인정보 처리방침
            </Text>
            을 확인해 주세요.
          </Text>
          {submitError && <Text style={styles.submitError}>{submitError}</Text>}
          <OwButton
            label={busy ? "가입 중…" : "회원가입"}
            onPress={handleSubmit}
            disabled={busy}
            loading={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.sm,
  },
  backLabel: { color: colors.ink, fontSize: 36, lineHeight: 38 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: spacing.sm },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  form: { gap: spacing.md },
  field: { gap: spacing.xs + 2 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.accentDeep },
  fieldError: { color: colors.accentDeep, fontSize: 12.5 },
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  genderChip: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  genderSelected: { borderColor: colors.brand, backgroundColor: colors.mintTint },
  genderLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
  genderSelectedLabel: { color: colors.brandDark },
  privacy: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  privacyLink: {
    color: colors.brandDark,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  submitError: {
    color: colors.accentDeep,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
});
