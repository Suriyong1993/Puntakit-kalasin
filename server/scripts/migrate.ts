import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as path from "node:path";
import * as fs from "node:fs";

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Connecting to database via neon-http...");
  const sql = neon(connectionString);
  const db = drizzle(sql);

  const migrationsFolder = path.resolve(process.cwd(), "server/db/migrations");
  console.log(`Running migrations from ${migrationsFolder}...`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully!");
  } catch (err) {
    console.error("Error applying migrations:", err);
    process.exit(1);
  }
}

run();
