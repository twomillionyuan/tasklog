import cors from "cors";
import express from "express";

import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { spotsRouter } from "./routes/spots.js";
import { uploadsRouter } from "./routes/uploads.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "*"
    })
  );
  app.use(express.json({ limit: "10mb" }));

  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "spotlog-api",
      ok: true,
      endpoints: ["/health", "/auth/register", "/auth/login", "/api/spots", "/api/uploads"]
    });
  });
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/api/spots", spotsRouter);
  app.use("/api/uploads", uploadsRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path
    });
  });

  return app;
}
