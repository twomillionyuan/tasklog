import { createApp } from "./app.js";
import { config } from "./config.js";
import { migrateDatabase } from "./db.js";
import { ensureStorageBucket } from "./storage.js";
import { initializeStore } from "./store.js";

async function startServer() {
  await migrateDatabase();
  await ensureStorageBucket();
  await initializeStore();

  const app = createApp();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`SpotLog API listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start SpotLog API", error);
  process.exit(1);
});
