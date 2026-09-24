import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { sql } from "drizzle-orm";
import { authRouter } from "./routes/auth";
import { activitiesRouter } from "./routes/activities";
import { membersRouter } from "./routes/members";
import { announcementsRouter } from "./routes/announcements";
import { eventsRouter } from "./routes/events";
import { ministriesRouter } from "./routes/ministries";
import { churchProfileRouter } from "./routes/churchProfile";
import { dashboardRouter } from "./routes/dashboard";
import { groupsRouter } from "./routes/groups";
import { attendanceRouter } from "./routes/attendance";
import { portalRouter } from "./routes/portal";
import { requestIdMiddleware } from "./middleware/requestId";
import { AppError } from "./lib/errors";
import { getDb } from "./db/client";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/activities", activitiesRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/me", portalRouter);
  app.use("/api/announcements", announcementsRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/ministries", ministriesRouter);
  app.use("/api/church-profile", churchProfileRouter);

  // Liveness Check
  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  // Readiness Check (verifies DB connectivity)
  app.get("/api/ready", async (_req, res) => {
    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      res.json({
        success: true,
        data: {
          status: "ready",
          database: "connected",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้",
          details: process.env.NODE_ENV !== "production" ? [String(err)] : undefined,
        },
      });
    }
  });

  // 404 Handler for undefined API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `ไม่พบ Endpoint: ${req.method} ${req.path}`,
      },
    });
  });

  // Centralized Standard Error Handler
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
      return;
    }

    // Unexpected internal server error
    console.error("Unhandled Exception:", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแล",
        details: process.env.NODE_ENV !== "production" ? [{ message: String(err) }] : undefined,
      },
    });
  };
  app.use(errorHandler);

  return app;
}
