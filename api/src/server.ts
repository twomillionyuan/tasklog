import { createApp } from "./app.js";
import { config } from "./config.js";
import { migrateDatabase } from "./db.js";
import { ensureStorageBucket } from "./storage.js";
import { initializeStore } from "./store.js";

async function startServer() {
  console.log("SpotLog startup: running database migrations");
  await migrateDatabase();
  console.log("SpotLog startup: ensuring storage bucket");
  await ensureStorageBucket();
  console.log("SpotLog startup: initializing seed data");
  await initializeStore();
  console.log("SpotLog startup: creating express app");

  const app = createApp();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`SpotLog API listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start SpotLog API", error);
  process.exit(1);
});
