import { Router } from "express";

import { createSession, createUser, loginUser } from "../store.js";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({
      error: "Valid email is required"
    });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters"
    });
  }

  try {
    const user = createUser(email, password);
    const token = createSession(user.id);

    return res.status(201).json({
      token,
      user
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    return res.status(500).json({
      error: "Could not create account"
    });
  }
});

authRouter.post("/login", (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  try {
    const user = loginUser(email, password);
    const token = createSession(user.id);

    return res.status(200).json({
      token,
      user
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    return res.status(500).json({
      error: "Could not log in"
    });
  }
});
