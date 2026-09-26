import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { users } from "../../shared/schema.js";
import { createUser } from "../routes/auth.js";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "ผู้ดูแลระบบ";

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const created = await createUser(email, password, name, "admin");
  console.log(`Created admin user: ${created.email} (${created.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
