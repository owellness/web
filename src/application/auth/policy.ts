// Pure credential policy. No Node/Next/SDK imports — must stay edge-safe
// because it's pulled into the middleware (proxy) bundle via authConfig.

export type AuthRole = "admin" | "author" | "viewer";

export type CredentialPolicyConfig = {
  username: string;
  password: string;
};

// Constant-time-ish string comparison in pure JS (no node:crypto, so it works
// in the edge runtime). Compares the full length and folds in any length
// difference to minimize timing signal.
const safeEqual = (a: string, b: string): boolean => {
  const len = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
};

export const createCredentialPolicy = (config: CredentialPolicyConfig) => {
  const configured = config.username.length > 0 && config.password.length > 0;

  return {
    /** Whether admin credentials are configured at all. */
    isConfigured(): boolean {
      return configured;
    },

    /** Validate a submitted username/password against the configured admin. */
    verify(input: {
      username: string | undefined | null;
      password: string | undefined | null;
    }): boolean {
      if (!configured) return false;
      const username = (input.username ?? "").trim();
      const password = input.password ?? "";
      if (!username || !password) return false;
      // Evaluate both comparisons (no short-circuit) to avoid timing leaks.
      const userOk = safeEqual(username, config.username);
      const passOk = safeEqual(password, config.password);
      return userOk && passOk;
    },
  };
};

export type CredentialPolicy = ReturnType<typeof createCredentialPolicy>;
