import type { NextFunction, Request, Response } from "express";

import { getUserByToken } from "../store.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing bearer token"
    });
  }

  const token = header.slice("Bearer ".length).trim();
  const user = await getUserByToken(token);

  if (!user) {
    return res.status(401).json({
      error: "Invalid token"
    });
  }

  req.authToken = token;
  req.authUser = user;
  next();
}
