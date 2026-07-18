import { jwtVerify, SignJWT } from "jose";

import type { AppTokenIssuer } from "@/application/appAuth/ports";

const ISSUER = "owellness-app";
/** v1: 단일 액세스 토큰 14일. 리프레시 토큰 회전은 v1.1에서 도입한다. */
const TTL_SECONDS = 60 * 60 * 24 * 14;

const secretKey = (): Uint8Array => {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) {
    throw new Error("APP_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

export const appJwtIssuer: AppTokenIssuer = {
  async issue(userId: string) {
    const accessToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${TTL_SECONDS}s`)
      .sign(secretKey());
    return { accessToken, expiresIn: TTL_SECONDS };
  },

  async verify(token: string) {
    try {
      const { payload } = await jwtVerify(token, secretKey(), {
        issuer: ISSUER,
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  },
};
