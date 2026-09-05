import {
  apiErrorSchema,
  emailSignupResponseSchema,
  type EmailSignupRequest,
  type EmailSignupResponse,
} from "@owellness/shared/api/v1";
import Constants from "expo-constants";

const apiUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "";

export const privacyPolicyUrl =
  (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ||
  `${apiUrl}/privacy`;

export class EmailSignupError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EmailSignupError";
  }
}

export async function signupWithEmail(
  input: EmailSignupRequest,
): Promise<EmailSignupResponse> {
  if (!apiUrl) {
    throw new EmailSignupError(
      "CONFIGURATION_ERROR",
      "앱 API 주소가 설정되지 않았어요.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/v1/auth/email/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new EmailSignupError(
      "NETWORK_ERROR",
      "서버에 연결할 수 없어요. 네트워크와 API 주소를 확인해 주세요.",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    const code = parsedError.success ? parsedError.data.error.code : "INTERNAL";
    throw new EmailSignupError(
      code,
      code === "ALREADY_EXISTS"
        ? "이미 가입된 이메일 또는 전화번호예요."
        : "회원가입을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  }

  const parsed = emailSignupResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new EmailSignupError(
      "INVALID_RESPONSE",
      "서버 응답을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.",
    );
  }
  return parsed.data;
}
