import cors from "cors";
import express from "express";

import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { healthRouter } from "./routes/health.js";
import { listsRouter } from "./routes/lists.js";
import { tasksRouter } from "./routes/tasks.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "*"
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "taskboard-api",
      ok: true,
      endpoints: [
        "/health",
        "/auth/register",
        "/auth/login",
        "/api/dashboard",
        "/api/lists",
        "/api/tasks"
      ]
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/lists", listsRouter);
  app.use("/api/tasks", tasksRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path
    });
  });

  return app;
}
