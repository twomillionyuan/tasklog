import cors from "cors";
import express from "express";

import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { spotsRouter } from "./routes/spots.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "*"
    })
  );
  app.use(express.json({ limit: "10mb" }));

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/api/spots", spotsRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path
    });
  });

  return app;
}
