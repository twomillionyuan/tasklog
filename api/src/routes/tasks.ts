import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { createTask, deleteTask, getTask, updateTask } from "../store.js";
import type { TaskUrgency } from "../types.js";

const validUrgencies = new Set<TaskUrgency>(["low", "medium", "high", "critical"]);

function readUrgency(value: unknown, fallback: TaskUrgency = "medium") {
  return typeof value === "string" && validUrgencies.has(value as TaskUrgency)
    ? (value as TaskUrgency)
    : fallback;
}

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.post("/", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const notes = typeof req.body?.notes === "string" ? req.body.notes : "";
  const listId = typeof req.body?.listId === "string" ? req.body.listId : "";
  const dueDate =
    typeof req.body?.dueDate === "string"
      ? req.body.dueDate
      : req.body?.dueDate === null
        ? null
        : null;

  if (title.length === 0) {
    return res.status(400).json({
      error: "title is required"
    });
  }

  if (listId.length === 0) {
    return res.status(400).json({
      error: "listId is required"
    });
  }

  try {
    const task = await createTask(req.authUser!.id, {
      title,
      notes,
      listId,
      urgency: readUrgency(req.body?.urgency),
      dueDate
    });

    return res.status(201).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "LIST_NOT_FOUND") {
      return res.status(404).json({
        error: "List not found"
      });
    }

    throw error;
  }
});

tasksRouter.get("/:id", async (req, res) => {
  const task = await getTask(req.authUser!.id, req.params.id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(200).json(task);
});

tasksRouter.patch("/:id", async (req, res) => {
  const updates = {
    title: typeof req.body?.title === "string" ? req.body.title : undefined,
    notes: typeof req.body?.notes === "string" ? req.body.notes : undefined,
    urgency:
      typeof req.body?.urgency === "string" && validUrgencies.has(req.body.urgency as TaskUrgency)
        ? (req.body.urgency as TaskUrgency)
        : undefined,
    dueDate:
      req.body?.dueDate === null || typeof req.body?.dueDate === "string"
        ? (req.body.dueDate as string | null)
        : undefined,
    completed: typeof req.body?.completed === "boolean" ? req.body.completed : undefined,
    listId: typeof req.body?.listId === "string" ? req.body.listId : undefined
  };

  if (updates.title !== undefined && updates.title.trim().length === 0) {
    return res.status(400).json({
      error: "title cannot be empty"
    });
  }

  try {
    const task = await updateTask(req.authUser!.id, req.params.id, updates);

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "LIST_NOT_FOUND") {
      return res.status(404).json({
        error: "List not found"
      });
    }

    throw error;
  }
});

tasksRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteTask(req.authUser!.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(204).send();
});
