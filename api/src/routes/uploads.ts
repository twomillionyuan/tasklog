import { randomUUID } from "node:crypto";

import multer from "multer";
import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../storage.js";

const upload = multer({
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  storage: multer.memoryStorage()
});

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Image file is required"
    });
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({
      error: "Only image uploads are supported"
    });
  }

  const uploaded = await uploadImage({
    userId: req.authUser!.id,
    buffer: req.file.buffer,
    contentType: req.file.mimetype
  });

  return res.status(201).json({
    id: randomUUID(),
    storageKey: uploaded.key,
    imageUrl: uploaded.imageUrl,
    createdAt: new Date().toISOString()
  });
});
