import { Router } from "express";

import { listActivity } from "../activity.js";
import { requireAuth } from "../middleware/auth.js";

export const activityRouter = Router();

activityRouter.use(requireAuth);

activityRouter.get("/", async (req, res) => {
  const activity = await listActivity(req.authUser!.id);

  res.status(200).json({
    activity
  });
});
