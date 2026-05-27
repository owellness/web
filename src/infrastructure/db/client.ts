import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

const BUILD_PLACEHOLDER = "postgres://placeholder:placeholder@localhost/placeholder";

const databaseUrl = process.env.DATABASE_URL ?? BUILD_PLACEHOLDER;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn(
    "[db] DATABASE_URL is not set; using a placeholder URL. Queries will fail at runtime.",
  );
}

// Neon HTTP only connects when a query is issued, so creating the client with a
// placeholder URL is safe during the Next.js build (no network call happens).
export const db: Database = drizzle(neon(databaseUrl), {
  schema,
  casing: "snake_case",
});
