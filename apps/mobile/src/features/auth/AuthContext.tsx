import type {
  EmailSignupRequest,
  EmailSignupResponse,
} from "@owellness/shared/api/v1";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

import { signupWithEmail } from "./email";

type AuthContextValue = {
  emailSession: EmailSignupResponse | null;
  signup: (input: EmailSignupRequest) => Promise<void>;
  logoutEmail: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [emailSession, setEmailSession] =
    useState<EmailSignupResponse | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      emailSession,
      async signup(input) {
        setEmailSession(await signupWithEmail(input));
      },
      logoutEmail() {
        setEmailSession(null);
      },
    }),
    [emailSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
