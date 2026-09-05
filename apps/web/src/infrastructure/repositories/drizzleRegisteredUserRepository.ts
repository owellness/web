import { countDistinct, desc, sql } from "drizzle-orm";

import type { RegisteredUser } from "@/application/users/model";
import type { RegisteredUserRepository } from "@/application/users/ports";
import { db } from "@/infrastructure/db/client";
import { accounts, users } from "@/infrastructure/db/schema";

export const drizzleRegisteredUserRepository: RegisteredUserRepository = {
  async listRecent(limit): Promise<RegisteredUser[]> {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        providers: sql<string[]>`array_agg(distinct ${accounts.provider})`,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(accounts, sql`${accounts.userId} = ${users.id}`)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return rows;
  },

  async count(): Promise<number> {
    const [row] = await db
      .select({ value: countDistinct(users.id) })
      .from(users)
      .innerJoin(accounts, sql`${accounts.userId} = ${users.id}`);

    return Number(row?.value ?? 0);
  },
};
