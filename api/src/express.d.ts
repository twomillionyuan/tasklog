import type { AuthUser } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      authToken?: string;
    }
  }
}

export {};
