import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import {
  archiveTaskList,
  createTaskList,
  getTaskList,
  listTaskLists,
  updateTaskList
} from "../store.js";

export const listsRouter = Router();

listsRouter.use(requireAuth);

listsRouter.get("/", async (req, res) => {
  const lists = await listTaskLists(req.authUser!.id);

  res.status(200).json({
    lists
  });
});

listsRouter.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const color = typeof req.body?.color === "string" ? req.body.color.trim() : "#D5E6C5";

  if (name.length === 0) {
    return res.status(400).json({
      error: "name is required"
    });
  }

  const list = await createTaskList(req.authUser!.id, {
    name,
    color
  });

  return res.status(201).json(list);
});

listsRouter.get("/:id", async (req, res) => {
  const list = await getTaskList(req.authUser!.id, req.params.id);

  if (!list) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  return res.status(200).json(list);
});

listsRouter.patch("/:id", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name : undefined;
  const color = typeof req.body?.color === "string" ? req.body.color : undefined;

  if (name !== undefined && name.trim().length === 0) {
    return res.status(400).json({
      error: "name cannot be empty"
    });
  }

  const list = await updateTaskList(req.authUser!.id, req.params.id, {
    name,
    color
  });

  if (!list) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  return res.status(200).json(list);
});

listsRouter.delete("/:id", async (req, res) => {
  const deleted = await archiveTaskList(req.authUser!.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  return res.status(204).send();
});
