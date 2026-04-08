import { Pool } from "pg";

import { config } from "./config.js";

export const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 10000
});

export async function migrateDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      attachment_url TEXT,
      attachment_storage_key TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      archived_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    ALTER TABLE task_lists
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    ALTER TABLE task_lists
    ADD COLUMN IF NOT EXISTS attachment_url TEXT;
  `);

  await pool.query(`
    ALTER TABLE task_lists
    ADD COLUMN IF NOT EXISTS attachment_storage_key TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      list_id TEXT NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
      due_date TIMESTAMPTZ,
      attachment_url TEXT,
      attachment_storage_key TEXT,
      before_photo_url TEXT,
      before_photo_storage_key TEXT,
      after_photo_url TEXT,
      after_photo_storage_key TEXT,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      deleted_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS attachment_url TEXT;
  `);

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS attachment_storage_key TEXT;
  `);

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS before_photo_url TEXT;
  `);

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS before_photo_storage_key TEXT;
  `);

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS after_photo_url TEXT;
  `);

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS after_photo_storage_key TEXT;
  `);

  await pool.query(`
    UPDATE tasks
    SET before_photo_url = COALESCE(before_photo_url, attachment_url),
        before_photo_storage_key = COALESCE(before_photo_storage_key, attachment_storage_key)
    WHERE attachment_url IS NOT NULL
       OR attachment_storage_key IS NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS task_lists_user_updated_idx
    ON task_lists (user_id, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS task_lists_user_sort_idx
    ON task_lists (user_id, sort_order ASC, created_at ASC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS tasks_user_rank_idx
    ON tasks (user_id, deleted_at, completed_at, due_date, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS tasks_list_rank_idx
    ON tasks (list_id, deleted_at, completed_at, due_date, updated_at DESC);
  `);
}
