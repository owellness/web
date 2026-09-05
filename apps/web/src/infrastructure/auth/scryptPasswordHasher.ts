import { randomBytes, scrypt } from "node:crypto";

import type { PasswordHasher } from "@/application/appAuth/ports";

const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

const deriveKey = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });

/** 무작위 salt를 사용하는 버전 명시형 scrypt 해시. 원문 비밀번호는 저장하지 않는다. */
export const scryptPasswordHasher: PasswordHasher = {
  async hash(password) {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(password, salt);
    return [
      "scrypt",
      "v1",
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString("base64url"),
      derivedKey.toString("base64url"),
    ].join("$");
  },
};
