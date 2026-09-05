import assert from "node:assert/strict";
import { test } from "node:test";

import { ApplicationError } from "@/application/shared/errors";

import type {
  AppTokenIssuer,
  AppUserRepository,
  EmailUserInfo,
  KakaoTokenVerifier,
  PasswordHasher,
} from "./ports";
import { createAppAuthService } from "./service";

const verifier: KakaoTokenVerifier = {
  async fetchUser() {
    throw new Error("not used");
  },
};

const tokens: AppTokenIssuer = {
  async issue(userId) {
    return { accessToken: `token-for-${userId}`, expiresIn: 120 };
  },
  async verify() {
    return null;
  },
};

const repository = (
  createEmailUser: (info: EmailUserInfo) => Promise<{ id: string; name: string } | null>,
): AppUserRepository => ({
  createEmailUser,
  async upsertKakaoUser() {
    throw new Error("not used");
  },
  async findById() {
    return null;
  },
  async findByEmail() {
    return null;
  },
});

const validInput = {
  name: " 홍길동 ",
  email: "USER@Example.com ",
  password: "wellness123",
  gender: "male",
  birthDate: "1990-05-12",
  phone: "010-1234-5678",
};

test("email signup normalizes input, hashes the password, and issues a token", async () => {
  let saved: EmailUserInfo | null = null;
  const passwords: PasswordHasher = {
    async hash(password) {
      assert.equal(password, "wellness123");
      return "stored-password-hash";
    },
  };
  const service = createAppAuthService({
    verifier,
    tokens,
    passwords,
    users: repository(async (info) => {
      saved = info;
      return { id: "123e4567-e89b-42d3-a456-426614174000", name: info.name };
    }),
  });

  const result = await service.signupWithEmail(validInput);

  assert.deepEqual(saved, {
    name: "홍길동",
    email: "user@example.com",
    passwordHash: "stored-password-hash",
    gender: "male",
    birthDate: "1990-05-12",
    phone: "01012345678",
  });
  assert.equal(result.accessToken, "token-for-123e4567-e89b-42d3-a456-426614174000");
  assert.equal(result.user.nickname, "홍길동");
});

test("invalid signup input stops before hashing or storage", async () => {
  let touched = false;
  const service = createAppAuthService({
    verifier,
    tokens,
    passwords: {
      async hash() {
        touched = true;
        return "unused";
      },
    },
    users: repository(async () => {
      touched = true;
      return null;
    }),
  });

  await assert.rejects(
    service.signupWithEmail({ ...validInput, birthDate: "2024-02-31" }),
    (error) =>
      error instanceof ApplicationError && error.code === "VALIDATION_FAILED",
  );
  assert.equal(touched, false);
});

test("duplicate email or phone returns an already-exists error", async () => {
  const service = createAppAuthService({
    verifier,
    tokens,
    passwords: { hash: async () => "stored-password-hash" },
    users: repository(async () => null),
  });

  await assert.rejects(
    service.signupWithEmail(validInput),
    (error) =>
      error instanceof ApplicationError && error.code === "ALREADY_EXISTS",
  );
});
