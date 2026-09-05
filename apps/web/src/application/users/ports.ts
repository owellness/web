import type { RegisteredUser } from "./model";

export interface RegisteredUserRepository {
  listRecent(limit: number): Promise<RegisteredUser[]>;
  count(): Promise<number>;
}
