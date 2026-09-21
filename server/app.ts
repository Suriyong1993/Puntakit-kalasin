import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { membersRouter } from "./routes/members";
import { announcementsRouter } from "./routes/announcements";
import { eventsRouter } from "./routes/events";
import { ministriesRouter } from "./routes/ministries";
import { churchProfileRouter } from "./routes/churchProfile";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/announcements", announcementsRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/ministries", ministriesRouter);
  app.use("/api/church-profile", churchProfileRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  };
  app.use(errorHandler);

  return app;
}
