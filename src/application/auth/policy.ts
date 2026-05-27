// Pure business policy. No Next.js / DB / SDK imports allowed.

export type AuthRole = "admin" | "author" | "viewer";

export type AuthPolicyConfig = {
  adminEmails: ReadonlyArray<string>;
};

const normalize = (email: string) => email.trim().toLowerCase();

export const createAuthPolicy = (config: AuthPolicyConfig) => {
  const adminSet = new Set(config.adminEmails.map(normalize).filter(Boolean));

  return {
    /** Decide whether sign-in is allowed at all (used by Auth.js `signIn` callback). */
    canSignIn(email: string | null | undefined): boolean {
      if (!email) return false;
      return adminSet.has(normalize(email));
    },

    /** Decide the role to assign on first sign-in. */
    roleFor(email: string | null | undefined): AuthRole {
      if (email && adminSet.has(normalize(email))) return "admin";
      return "viewer";
    },

    /** Check whether a session is allowed to enter the admin area. */
    canAccessAdmin(role: AuthRole | null | undefined): boolean {
      return role === "admin";
    },

    isAdminEmail(email: string | null | undefined): boolean {
      if (!email) return false;
      return adminSet.has(normalize(email));
    },
  };
};

export type AuthPolicy = ReturnType<typeof createAuthPolicy>;
