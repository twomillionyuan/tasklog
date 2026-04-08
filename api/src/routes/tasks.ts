import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middleware/auth.js";
import { createTask, deleteTask, getTask, setTaskPhoto, updateTask } from "../store.js";
import { removeAttachment, uploadTaskPhoto } from "../storage.js";
import type { TaskUrgency } from "../types.js";

const validUrgencies = new Set<TaskUrgency>(["low", "medium", "high", "critical"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  }
});

function readUrgency(value: unknown, fallback: TaskUrgency = "medium") {
  return typeof value === "string" && validUrgencies.has(value as TaskUrgency)
    ? (value as TaskUrgency)
    : fallback;
}

function readParamId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
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

    if (error instanceof Error && error.message === "AFTER_PHOTO_REQUIRED") {
      return res.status(400).json({
        error: "Add both a before photo and an after photo before completing this task"
      });
    }

    throw error;
  }
});

tasksRouter.get("/:id", async (req, res) => {
  const task = await getTask(req.authUser!.id, readParamId(req.params.id));

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(200).json(task);
});

function registerPhotoRoutes(kind: "before" | "after") {
  tasksRouter.post(`/:id/${kind}-photo`, upload.single("image"), async (req, res) => {
    const task = await getTask(req.authUser!.id, readParamId(req.params.id));

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    if (!req.file || !req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        error: "Image file is required"
      });
    }

    try {
      const uploaded = await uploadTaskPhoto({
        userId: req.authUser!.id,
        taskId: task.id,
        kind,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      const existingStorageKey =
        kind === "before" ? task.beforePhotoStorageKey : task.afterPhotoStorageKey;

      if (existingStorageKey) {
        await removeAttachment(existingStorageKey);
      }

      const updated = await setTaskPhoto(req.authUser!.id, task.id, kind, {
        photoUrl: uploaded.attachmentUrl,
        photoStorageKey: uploaded.key
      });

      return res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === "STORAGE_DISABLED") {
        return res.status(503).json({
          error: "Storage is not configured"
        });
      }

      throw error;
    }
  });

  tasksRouter.delete(`/:id/${kind}-photo`, async (req, res) => {
    const task = await getTask(req.authUser!.id, readParamId(req.params.id));

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    const existingPhotoUrl = kind === "before" ? task.beforePhotoUrl : task.afterPhotoUrl;
    const existingStorageKey =
      kind === "before" ? task.beforePhotoStorageKey : task.afterPhotoStorageKey;

    if (!existingPhotoUrl) {
      return res.status(200).json(task);
    }

    try {
      if (existingStorageKey) {
        await removeAttachment(existingStorageKey);
      }

      const updated = await setTaskPhoto(req.authUser!.id, task.id, kind, {
        photoUrl: null,
        photoStorageKey: null
      });

      return res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === "STORAGE_DISABLED") {
        return res.status(503).json({
          error: "Storage is not configured"
        });
      }

      throw error;
    }
  });
}

registerPhotoRoutes("before");
registerPhotoRoutes("after");

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
    const task = await updateTask(req.authUser!.id, readParamId(req.params.id), updates);

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

    if (error instanceof Error && error.message === "AFTER_PHOTO_REQUIRED") {
      return res.status(400).json({
        error: "Add both a before photo and an after photo before completing this task"
      });
    }

    throw error;
  }
});

tasksRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteTask(req.authUser!.id, readParamId(req.params.id));

  if (!deleted) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(204).send();
});
