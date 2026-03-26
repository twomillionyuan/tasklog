import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "taskboard-api",
    timestamp: new Date().toISOString()
  });
});
