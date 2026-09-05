import type { RegisteredUserRepository } from "./ports";

export const createRegisteredUserService = (
  repository: RegisteredUserRepository,
) => ({
  async listRecent(limit = 200) {
    return repository.listRecent(limit);
  },

  async count() {
    return repository.count();
  },
});

export type RegisteredUserService = ReturnType<
  typeof createRegisteredUserService
>;
