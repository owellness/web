import { countDistinct, desc, isNotNull, or, sql } from "drizzle-orm";

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
        providers: sql<string[]>`case
          when ${users.passwordHash} is not null then array['email']::text[]
          else array_agg(distinct ${accounts.provider})
        end`,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(accounts, sql`${accounts.userId} = ${users.id}`)
      .where(or(isNotNull(users.passwordHash), isNotNull(accounts.userId)))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return rows;
  },

  async count(): Promise<number> {
    const [row] = await db
      .select({ value: countDistinct(users.id) })
      .from(users)
      .leftJoin(accounts, sql`${accounts.userId} = ${users.id}`)
      .where(or(isNotNull(users.passwordHash), isNotNull(accounts.userId)));

    return Number(row?.value ?? 0);
  },
};
