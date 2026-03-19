import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { createSpot, getSpot, listSpots, softDeleteSpot, updateSpot } from "../store.js";
import type { SpotPhoto } from "../types.js";

export const spotsRouter = Router();

spotsRouter.use(requireAuth);

spotsRouter.get("/", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const favorited =
    typeof req.query.favorited === "string"
      ? req.query.favorited === "true"
      : undefined;

  const data = listSpots(req.authUser!.id, {
    search,
    favorited
  });

  res.status(200).json({
    spots: data
  });
});

spotsRouter.post("/", (req, res) => {
  const title = req.body?.title;
  const latitude = Number(req.body?.latitude);
  const longitude = Number(req.body?.longitude);
  const note = typeof req.body?.note === "string" ? req.body.note : "";
  const favorited = typeof req.body?.favorited === "boolean" ? req.body.favorited : false;
  const photos = Array.isArray(req.body?.photos) ? (req.body.photos as SpotPhoto[]) : [];

  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({
      error: "title is required"
    });
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({
      error: "latitude and longitude are required"
    });
  }

  const spot = createSpot(req.authUser!.id, {
    title,
    note,
    latitude,
    longitude,
    favorited,
    photos
  });

  return res.status(201).json(spot);
});

spotsRouter.get("/:id", (req, res) => {
  const spot = getSpot(req.authUser!.id, req.params.id);

  if (!spot) {
    return res.status(404).json({
      error: "Spot not found"
    });
  }

  return res.status(200).json(spot);
});

spotsRouter.patch("/:id", (req, res) => {
  const updates = {
    title: typeof req.body?.title === "string" ? req.body.title : undefined,
    note: typeof req.body?.note === "string" ? req.body.note : undefined,
    favorited: typeof req.body?.favorited === "boolean" ? req.body.favorited : undefined,
    latitude: typeof req.body?.latitude === "number" ? req.body.latitude : undefined,
    longitude: typeof req.body?.longitude === "number" ? req.body.longitude : undefined
  };

  if (
    updates.title !== undefined &&
    updates.title.trim().length === 0
  ) {
    return res.status(400).json({
      error: "title cannot be empty"
    });
  }

  const spot = updateSpot(req.authUser!.id, req.params.id, updates);

  if (!spot) {
    return res.status(404).json({
      error: "Spot not found"
    });
  }

  return res.status(200).json(spot);
});

spotsRouter.delete("/:id", (req, res) => {
  const deleted = softDeleteSpot(req.authUser!.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({
      error: "Spot not found"
    });
  }

  return res.status(204).send();
});
