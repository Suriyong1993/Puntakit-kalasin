import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import path from "node:path";
import * as schema from "../../shared/schema";

type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

export function getDb(): Db {
  if (_db) return _db as Db;

  const connectionString = process.env.DATABASE_URL;

  // Support local embedded PostgreSQL (PGlite) for reliable local dev without cloud dependence
  if (process.env.USE_LOCAL_DB === "true" || !connectionString) {
    const client = new PGlite(path.resolve("./.db_data"));
    _db = drizzlePglite(client, { schema });
    return _db as Db;
  }

  if (connectionString.includes("neon.tech") || connectionString.startsWith("https://")) {
    const sql = neon(connectionString);
    _db = drizzleNeon(sql, { schema });
  } else {
    const client = postgres(connectionString, { prepare: false });
    _db = drizzlePostgres(client, { schema });
  }

  return _db as Db;
}
