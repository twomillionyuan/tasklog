import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { getDashboard } from "../store.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req, res) => {
  const dashboard = await getDashboard(req.authUser!.id);
  res.status(200).json(dashboard);
});
