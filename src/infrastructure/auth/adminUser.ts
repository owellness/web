import { sql } from "drizzle-orm";

import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * Ensures a `users` row exists for the credential admin and returns it.
 *
 * With the Credentials + JWT strategy Auth.js no longer persists users via the
 * adapter, but article authorship still references `users.id` (FK), so we keep
 * a stable row keyed by the admin email.
 */
export const ensureAdminUser = async (input: {
  username: string;
  email: string;
  name: string;
}): Promise<AdminUser> => {
  const email = input.email.toLowerCase();
  const [row] = await db
    .insert(users)
    .values({ email, name: input.name, role: "admin" })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: "admin", name: input.name, emailVerified: sql`now()` },
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  return { id: row.id, email: row.email, name: row.name ?? input.name };
};
