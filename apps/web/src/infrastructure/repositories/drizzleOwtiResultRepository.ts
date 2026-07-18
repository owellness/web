import { desc, eq } from "drizzle-orm";

import type {
  OwtiResultInsert,
  OwtiResultRecord,
  OwtiResultRepository,
} from "@/application/owtiResults/ports";

import { db } from "@/infrastructure/db/client";
import { owtiResults } from "@/infrastructure/db/schema";

export const drizzleOwtiResultRepository: OwtiResultRepository = {
  async insert(input: OwtiResultInsert): Promise<OwtiResultRecord> {
    const [row] = await db.insert(owtiResults).values(input).returning();
    return row;
  },

  async listByUser(userId: string, limit = 50): Promise<OwtiResultRecord[]> {
    return db
      .select()
      .from(owtiResults)
      .where(eq(owtiResults.userId, userId))
      .orderBy(desc(owtiResults.createdAt))
      .limit(limit);
  },
};
