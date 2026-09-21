import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { members } from "../../shared/schema";
import { memberInputSchema } from "../../shared/validation";
import { requireAdmin, requireAuth } from "../middleware/auth";

export const membersRouter = Router();

membersRouter.use(requireAuth);

membersRouter.get("/", async (_req, res) => {
  const db = getDb();
  const rows = await db.select().from(members).orderBy(desc(members.createdAt));
  res.json({ success: true, data: rows });
});

membersRouter.get("/:id", async (req, res) => {
  const db = getDb();
  const [row] = await db.select().from(members).where(eq(members.id, req.params.id)).limit(1);
  if (!row) {
    res.status(404).json({ success: false, error: "ไม่พบสมาชิก" });
    return;
  }
  res.json({ success: true, data: row });
});

membersRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = memberInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" });
    return;
  }
  const db = getDb();
  const [created] = await db
    .insert(members)
    .values({
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      area: parsed.data.area || null,
      group: parsed.data.group || null,
      notes: parsed.data.notes || null,
    })
    .returning();
  res.status(201).json({ success: true, data: created });
});

membersRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = memberInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" });
    return;
  }
  const db = getDb();
  const [updated] = await db
    .update(members)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(members.id, req.params.id))
    .returning();
  if (!updated) {
    res.status(404).json({ success: false, error: "ไม่พบสมาชิก" });
    return;
  }
  res.json({ success: true, data: updated });
});

membersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const db = getDb();
  const [deleted] = await db.delete(members).where(eq(members.id, req.params.id)).returning();
  if (!deleted) {
    res.status(404).json({ success: false, error: "ไม่พบสมาชิก" });
    return;
  }
  res.json({ success: true, data: deleted });
});
