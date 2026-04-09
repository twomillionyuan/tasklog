import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { recordActivity } from "./activity.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import type {
  AuthUser,
  DashboardResponse,
  DashboardSummary,
  TaskCounts,
  TaskListResponse,
  TaskListRow,
  TaskResponse,
  TaskRow,
  TaskUrgency
} from "./types.js";

const urgencyRanks: Record<TaskUrgency, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const seedLists = [
  {
    name: "Work",
    color: "#DCC8F5",
    tasks: [
      {
        title: "Review launch checklist",
        notes: "Check release notes, comms, and rollback plan before noon.",
        urgency: "critical" as const,
        dueInDays: 0,
        completed: false
      },
      {
        title: "Reply to design feedback",
        notes: "Close the loop on the onboarding copy changes.",
        urgency: "high" as const,
        dueInDays: 1,
        completed: false
      },
      {
        title: "Archive old sprint board",
        notes: "Move finished tickets and update the retrospective notes.",
        urgency: "medium" as const,
        dueInDays: -1,
        completed: true
      }
    ]
  },
  {
    name: "Home",
    color: "#F0CFE3",
    tasks: [
      {
        title: "Book dentist appointment",
        notes: "Find a morning slot next week.",
        urgency: "high" as const,
        dueInDays: 2,
        completed: false
      },
      {
        title: "Refill pantry staples",
        notes: "Rice, olive oil, oats, and coffee beans.",
        urgency: "medium" as const,
        dueInDays: 3,
        completed: false
      }
    ]
  },
  {
    name: "Someday",
    color: "#CFE0FF",
    tasks: [
      {
        title: "Plan summer trip budget",
        notes: "Rough flight, hotel, and food estimate.",
        urgency: "low" as const,
        dueInDays: 10,
        completed: false
      }
    ]
  }
] as const;

type UserRecord = AuthUser & {
  passwordHash: string;
};

function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

function toTaskResponse(task: TaskRow): TaskResponse {
  return {
    id: task.id,
    listId: task.listId,
    title: task.title,
    notes: task.notes,
    urgency: task.urgency,
    dueDate: task.dueDate,
    beforePhotoUrl: task.beforePhotoUrl,
    beforePhotoStorageKey: task.beforePhotoStorageKey,
    afterPhotoUrl: task.afterPhotoUrl,
    afterPhotoStorageKey: task.afterPhotoStorageKey,
    completed: Boolean(task.completedAt),
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function compareTasks(left: TaskResponse, right: TaskResponse) {
  if (left.completed !== right.completed) {
    return left.completed ? 1 : -1;
  }

  const urgencyDelta = urgencyRanks[right.urgency] - urgencyRanks[left.urgency];

  if (urgencyDelta !== 0) {
    return urgencyDelta;
  }

  if (left.dueDate && right.dueDate) {
    return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
  }

  if (left.dueDate) {
    return -1;
  }

  if (right.dueDate) {
    return 1;
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

function computeTaskCounts(tasks: TaskResponse[]): TaskCounts {
  const now = Date.now();
  let completed = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
      continue;
    }

    if (task.dueDate && new Date(task.dueDate).getTime() < now) {
      overdue += 1;
    }
  }

  return {
    total: tasks.length,
    open: tasks.length - completed,
    completed,
    overdue
  };
}

function toTaskListResponse(list: TaskListRow, tasks: TaskResponse[]): TaskListResponse {
  const sortedTasks = [...tasks].sort(compareTasks);

  return {
    id: list.id,
    name: list.name,
    color: list.color,
    attachmentUrl: list.attachment_url,
    attachmentStorageKey: list.attachment_storage_key,
    sortOrder: list.sort_order,
    createdAt: list.created_at,
    updatedAt: list.updated_at,
    summary: computeTaskCounts(sortedTasks),
    tasks: sortedTasks
  };
}

async function getUserByEmail(email: string) {
  const result = await pool.query<{
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
  }>(
    `
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at
  } satisfies UserRecord;
}

async function listRowsForUser(userId: string) {
  const [listsResult, tasksResult] = await Promise.all([
    pool.query<TaskListRow>(
      `
        SELECT id, user_id, name, color, attachment_url, attachment_storage_key, sort_order, created_at, updated_at, archived_at
        FROM task_lists
        WHERE user_id = $1
          AND archived_at IS NULL
        ORDER BY sort_order ASC, created_at ASC
      `,
      [userId]
    ),
    pool.query<{
      id: string;
      user_id: string;
      list_id: string;
      title: string;
      notes: string;
      urgency: TaskUrgency;
      due_date: string | null;
      attachment_url: string | null;
      attachment_storage_key: string | null;
      before_photo_url: string | null;
      before_photo_storage_key: string | null;
      after_photo_url: string | null;
      after_photo_storage_key: string | null;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    }>(
      `
        SELECT
          id,
          user_id,
          list_id,
          title,
          notes,
          urgency,
          due_date,
          attachment_url,
          attachment_storage_key,
          before_photo_url,
          before_photo_storage_key,
          after_photo_url,
          after_photo_storage_key,
          completed_at,
          created_at,
          updated_at,
          deleted_at
        FROM tasks
        WHERE user_id = $1
          AND deleted_at IS NULL
      `,
      [userId]
    )
  ]);

  const tasksByList = new Map<string, TaskResponse[]>();

  for (const row of tasksResult.rows) {
    const current = tasksByList.get(row.list_id) ?? [];
    current.push(
      toTaskResponse({
        id: row.id,
        userId: row.user_id,
        listId: row.list_id,
        title: row.title,
        notes: row.notes,
        urgency: row.urgency,
        dueDate: row.due_date,
        beforePhotoUrl: row.before_photo_url ?? row.attachment_url,
        beforePhotoStorageKey: row.before_photo_storage_key ?? row.attachment_storage_key,
        afterPhotoUrl: row.after_photo_url,
        afterPhotoStorageKey: row.after_photo_storage_key,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at
      })
    );
    tasksByList.set(row.list_id, current);
  }

  return {
    lists: listsResult.rows,
    tasksByList
  };
}

async function getListRow(userId: string, listId: string) {
  const result = await pool.query<TaskListRow>(
    `
      SELECT id, user_id, name, color, attachment_url, attachment_storage_key, sort_order, created_at, updated_at, archived_at
      FROM task_lists
      WHERE id = $1
        AND user_id = $2
        AND archived_at IS NULL
      LIMIT 1
    `,
    [listId, userId]
  );

  return result.rows[0] ?? null;
}

async function ensureStarterList(userId: string) {
  const timestamp = new Date().toISOString();

  await pool.query(
    `
      INSERT INTO task_lists (id, user_id, name, color, sort_order, created_at, updated_at, archived_at)
      VALUES ($1, $2, $3, $4, 0, $5, $5, NULL)
    `,
    [randomUUID(), userId, "General", "#DCC8F5", timestamp]
  );
}

async function getNextListSortOrder(userId: string) {
  const result = await pool.query<{ next_sort_order: number }>(
    `
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
      FROM task_lists
      WHERE user_id = $1
        AND archived_at IS NULL
    `,
    [userId]
  );

  return Number(result.rows[0]?.next_sort_order ?? 0);
}

export async function initializeStore() {
  let user = await getUserByEmail("ebba@example.com");

  if (!user) {
    const passwordHash = await bcrypt.hash("secret12", 10);
    const createdAt = new Date().toISOString();
    const userId = randomUUID();

    await pool.query(
      `
        INSERT INTO users (id, email, password_hash, created_at)
        VALUES ($1, $2, $3, $4)
      `,
      [userId, "ebba@example.com", passwordHash, createdAt]
    );

    user = {
      id: userId,
      email: "ebba@example.com",
      passwordHash,
      createdAt
    };
  }

  const countResult = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM task_lists
      WHERE user_id = $1
        AND archived_at IS NULL
    `,
    [user.id]
  );

  if (Number(countResult.rows[0]?.count ?? "0") > 0) {
    return;
  }

  for (const [index, list] of seedLists.entries()) {
    const listId = randomUUID();
    const listTimestamp = new Date().toISOString();

    await pool.query(
      `
        INSERT INTO task_lists (id, user_id, name, color, sort_order, created_at, updated_at, archived_at)
        VALUES ($1, $2, $3, $4, $5, $6, $6, NULL)
      `,
      [listId, user.id, list.name, list.color, index, listTimestamp]
    );

    for (const task of list.tasks) {
      const createdAt = new Date().toISOString();
      const dueDate = new Date();
      dueDate.setUTCDate(dueDate.getUTCDate() + task.dueInDays);

      await pool.query(
        `
          INSERT INTO tasks (
            id,
            user_id,
            list_id,
            title,
            notes,
            urgency,
            due_date,
            completed_at,
            created_at,
            updated_at,
            deleted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, NULL)
        `,
        [
          randomUUID(),
          user.id,
          listId,
          task.title,
          task.notes,
          task.urgency,
          dueDate.toISOString(),
          task.completed ? createdAt : null,
          createdAt
        ]
      );
    }
  }
}

export async function createUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);

  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const userId = randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4)
    `,
    [userId, normalizedEmail, passwordHash, createdAt]
  );

  await ensureStarterList(userId);

  return {
    id: userId,
    email: normalizedEmail,
    createdAt
  } satisfies AuthUser;
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return toAuthUser(user);
}

export function createSession(userId: string) {
  const createdAt = new Date().toISOString();
  const token = jwt.sign({ sub: userId, createdAt }, config.jwtSecret, {
    expiresIn: "30d"
  });

  return {
    token,
    userId,
    createdAt
  };
}

export async function getUserByToken(token: string) {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };

    if (!payload.sub) {
      return null;
    }

    const result = await pool.query<{
      id: string;
      email: string;
      created_at: string;
    }>(
      `
        SELECT id, email, created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [payload.sub]
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      createdAt: row.created_at
    } satisfies AuthUser;
  } catch {
    return null;
  }
}

export async function listTaskLists(userId: string) {
  const { lists, tasksByList } = await listRowsForUser(userId);

  return lists.map((list) => toTaskListResponse(list, tasksByList.get(list.id) ?? []));
}

export async function getTaskList(userId: string, listId: string) {
  const list = await getListRow(userId, listId);

  if (!list) {
    return null;
  }

  const { tasksByList } = await listRowsForUser(userId);
  return toTaskListResponse(list, tasksByList.get(list.id) ?? []);
}

export async function createTaskList(
  userId: string,
  input: {
    name: string;
    color: string;
  }
) {
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const sortOrder = await getNextListSortOrder(userId);

  await pool.query(
    `
      INSERT INTO task_lists (id, user_id, name, color, sort_order, created_at, updated_at, archived_at)
      VALUES ($1, $2, $3, $4, $5, $6, $6, NULL)
    `,
    [id, userId, input.name.trim(), input.color.trim(), sortOrder, timestamp]
  );

  void recordActivity({
    userId,
    entityType: "list",
    entityId: id,
    title: input.name.trim(),
    type: "created"
  });

  return getTaskList(userId, id);
}

export async function updateTaskList(
  userId: string,
  listId: string,
  input: Partial<Pick<TaskListResponse, "name" | "color">>
) {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof input.name === "string") {
    values.push(input.name.trim());
    updates.push(`name = $${values.length}`);
  }

  if (typeof input.color === "string") {
    values.push(input.color.trim());
    updates.push(`color = $${values.length}`);
  }

  if (updates.length === 0) {
    return getTaskList(userId, listId);
  }

  values.push(new Date().toISOString());
  updates.push(`updated_at = $${values.length}`);

  values.push(listId);
  values.push(userId);

  await pool.query(
    `
      UPDATE task_lists
      SET ${updates.join(", ")}
      WHERE id = $${values.length - 1}
        AND user_id = $${values.length}
        AND archived_at IS NULL
    `,
    values
  );

  const updated = await getTaskList(userId, listId);

  if (updated) {
    void recordActivity({
      userId,
      entityType: "list",
      entityId: listId,
      title: updated.name,
      type: "updated"
    });
  }

  return updated;
}

export async function archiveTaskList(userId: string, listId: string) {
  const list = await getTaskList(userId, listId);

  if (!list) {
    return null;
  }

  const timestamp = new Date().toISOString();

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        UPDATE task_lists
        SET archived_at = $1,
            updated_at = $1
        WHERE id = $2
          AND user_id = $3
          AND archived_at IS NULL
      `,
      [timestamp, listId, userId]
    );

    await pool.query(
      `
        UPDATE tasks
        SET deleted_at = $1,
            updated_at = $1
        WHERE list_id = $2
          AND user_id = $3
          AND deleted_at IS NULL
      `,
      [timestamp, listId, userId]
    );

    await pool.query("COMMIT");

    void recordActivity({
      userId,
      entityType: "list",
      entityId: listId,
      title: list.name,
      type: "deleted"
    });

    return list;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function reorderTaskLists(userId: string, orderedListIds: string[]) {
  const existingLists = await listTaskLists(userId);

  if (existingLists.length !== orderedListIds.length) {
    throw new Error("INVALID_LIST_ORDER");
  }

  const existingIds = new Set(existingLists.map((list) => list.id));

  for (const listId of orderedListIds) {
    if (!existingIds.has(listId)) {
      throw new Error("INVALID_LIST_ORDER");
    }
  }

  await pool.query("BEGIN");

  try {
    for (const [index, listId] of orderedListIds.entries()) {
      await pool.query(
        `
          UPDATE task_lists
          SET sort_order = $1
          WHERE id = $2
            AND user_id = $3
            AND archived_at IS NULL
        `,
        [index, listId, userId]
      );
    }

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  return listTaskLists(userId);
}

export async function getTask(userId: string, taskId: string) {
  const result = await pool.query<{
    id: string;
    user_id: string;
    list_id: string;
    title: string;
    notes: string;
    urgency: TaskUrgency;
    due_date: string | null;
    attachment_url: string | null;
    attachment_storage_key: string | null;
    before_photo_url: string | null;
    before_photo_storage_key: string | null;
    after_photo_url: string | null;
    after_photo_storage_key: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>(
    `
      SELECT
        id,
        user_id,
        list_id,
        title,
        notes,
        urgency,
        due_date,
        attachment_url,
        attachment_storage_key,
        before_photo_url,
        before_photo_storage_key,
        after_photo_url,
        after_photo_storage_key,
        completed_at,
        created_at,
        updated_at,
        deleted_at
      FROM tasks
      WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [taskId, userId]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return toTaskResponse({
    id: row.id,
    userId: row.user_id,
    listId: row.list_id,
    title: row.title,
    notes: row.notes,
    urgency: row.urgency,
    dueDate: row.due_date,
    beforePhotoUrl: row.before_photo_url ?? row.attachment_url,
    beforePhotoStorageKey: row.before_photo_storage_key ?? row.attachment_storage_key,
    afterPhotoUrl: row.after_photo_url,
    afterPhotoStorageKey: row.after_photo_storage_key,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  });
}

export async function createTask(
  userId: string,
  input: {
    listId: string;
    title: string;
    notes: string;
    urgency: TaskUrgency;
    dueDate: string | null;
  }
) {
  const list = await getListRow(userId, input.listId);

  if (!list) {
    throw new Error("LIST_NOT_FOUND");
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        INSERT INTO tasks (
          id,
          user_id,
          list_id,
          title,
          notes,
          urgency,
          due_date,
          attachment_url,
          attachment_storage_key,
          before_photo_url,
          before_photo_storage_key,
          after_photo_url,
          after_photo_storage_key,
          completed_at,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, $8, $8, NULL)
      `,
      [
        id,
        userId,
        input.listId,
        input.title.trim(),
        input.notes.trim(),
        input.urgency,
        input.dueDate,
        timestamp
      ]
    );

    await pool.query(
      `
        UPDATE task_lists
        SET updated_at = $1
        WHERE id = $2
          AND user_id = $3
      `,
      [timestamp, input.listId, userId]
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  void recordActivity({
    userId,
    entityType: "task",
    entityId: id,
    title: input.title.trim(),
    type: "created"
  });

  return getTask(userId, id);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: Partial<{
    title: string;
    notes: string;
    urgency: TaskUrgency;
    dueDate: string | null;
    completed: boolean;
    listId: string;
  }>
) {
  const existing = await getTask(userId, taskId);

  if (!existing) {
    return null;
  }

  if (typeof input.listId === "string") {
    const nextList = await getListRow(userId, input.listId);

    if (!nextList) {
      throw new Error("LIST_NOT_FOUND");
    }
  }

  const values: unknown[] = [];
  const updates: string[] = [];
  const nextTimestamp = new Date().toISOString();
  const nextCompleted =
    typeof input.completed === "boolean" ? input.completed : existing.completed;

  if (input.completed === true && !existing.afterPhotoUrl) {
    throw new Error("AFTER_PHOTO_REQUIRED");
  }

  if (typeof input.title === "string") {
    values.push(input.title.trim());
    updates.push(`title = $${values.length}`);
  }

  if (typeof input.notes === "string") {
    values.push(input.notes.trim());
    updates.push(`notes = $${values.length}`);
  }

  if (typeof input.urgency === "string") {
    values.push(input.urgency);
    updates.push(`urgency = $${values.length}`);
  }

  if (input.dueDate !== undefined) {
    values.push(input.dueDate);
    updates.push(`due_date = $${values.length}`);
  }

  if (typeof input.listId === "string") {
    values.push(input.listId);
    updates.push(`list_id = $${values.length}`);
  }

  if (typeof input.completed === "boolean") {
    values.push(input.completed ? existing.completedAt ?? nextTimestamp : null);
    updates.push(`completed_at = $${values.length}`);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(nextTimestamp);
  updates.push(`updated_at = $${values.length}`);

  values.push(taskId);
  values.push(userId);

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        UPDATE tasks
        SET ${updates.join(", ")}
        WHERE id = $${values.length - 1}
          AND user_id = $${values.length}
          AND deleted_at IS NULL
      `,
      values
    );

    const touchedListIds = new Set<string>([existing.listId, input.listId ?? existing.listId]);

    for (const listId of touchedListIds) {
      await pool.query(
        `
          UPDATE task_lists
          SET updated_at = $1
          WHERE id = $2
            AND user_id = $3
            AND archived_at IS NULL
        `,
        [nextTimestamp, listId, userId]
      );
    }

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  const updated = await getTask(userId, taskId);

  if (updated) {
    void recordActivity({
      userId,
      entityType: "task",
      entityId: taskId,
      title: updated.title,
      type: nextCompleted && !existing.completed ? "completed" : "updated"
    });
  }

  return updated;
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await getTask(userId, taskId);

  if (!existing) {
    return null;
  }

  const timestamp = new Date().toISOString();

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        UPDATE tasks
        SET deleted_at = $1,
            updated_at = $1
        WHERE id = $2
          AND user_id = $3
          AND deleted_at IS NULL
      `,
      [timestamp, taskId, userId]
    );

    await pool.query(
      `
        UPDATE task_lists
        SET updated_at = $1
        WHERE id = $2
          AND user_id = $3
          AND archived_at IS NULL
      `,
      [timestamp, existing.listId, userId]
    );

    await pool.query("COMMIT");

    void recordActivity({
      userId,
      entityType: "task",
      entityId: taskId,
      title: existing.title,
      type: "deleted"
    });

    return existing;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function setTaskPhoto(
  userId: string,
  taskId: string,
  kind: "before" | "after",
  photo: {
    photoUrl: string | null;
    photoStorageKey: string | null;
  }
) {
  const existing = await getTask(userId, taskId);

  if (!existing) {
    return null;
  }

  const timestamp = new Date().toISOString();

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        UPDATE tasks
        SET ${kind === "before" ? "before_photo_url" : "after_photo_url"} = $1,
            ${kind === "before" ? "before_photo_storage_key" : "after_photo_storage_key"} = $2,
            updated_at = $3
        WHERE id = $4
          AND user_id = $5
          AND deleted_at IS NULL
      `,
      [photo.photoUrl, photo.photoStorageKey, timestamp, taskId, userId]
    );

    await pool.query(
      `
        UPDATE task_lists
        SET updated_at = $1
        WHERE id = $2
          AND user_id = $3
          AND archived_at IS NULL
      `,
      [timestamp, existing.listId, userId]
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  const updated = await getTask(userId, taskId);

  if (updated) {
    void recordActivity({
      userId,
      entityType: "task",
      entityId: taskId,
      title: updated.title,
      type: photo.photoUrl ? "attached" : "updated"
    });
  }

  return updated;
}

export async function setTaskListAttachment(
  userId: string,
  listId: string,
  attachment: {
    attachmentUrl: string | null;
    attachmentStorageKey: string | null;
  }
) {
  const existing = await getListRow(userId, listId);

  if (!existing) {
    return null;
  }

  const timestamp = new Date().toISOString();

  await pool.query(
    `
      UPDATE task_lists
      SET attachment_url = $1,
          attachment_storage_key = $2,
          updated_at = $3
      WHERE id = $4
        AND user_id = $5
        AND archived_at IS NULL
    `,
    [attachment.attachmentUrl, attachment.attachmentStorageKey, timestamp, listId, userId]
  );

  const updated = await getTaskList(userId, listId);

  if (updated) {
    void recordActivity({
      userId,
      entityType: "list",
      entityId: listId,
      title: updated.name,
      type: attachment.attachmentUrl ? "attached" : "updated"
    });
  }

  return updated;
}

function isSameUtcDate(dateValue: string, current: Date) {
  const target = new Date(dateValue);

  return (
    target.getUTCFullYear() === current.getUTCFullYear() &&
    target.getUTCMonth() === current.getUTCMonth() &&
    target.getUTCDate() === current.getUTCDate()
  );
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const lists = await listTaskLists(userId);
  const tasks = lists.flatMap((list) => list.tasks);
  const summary: DashboardSummary = {
    listCount: lists.length,
    totalTasks: tasks.length,
    openTasks: tasks.filter((task) => !task.completed).length,
    completedTasks: tasks.filter((task) => task.completed).length,
    overdueTasks: tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate).getTime() < Date.now()
    ).length,
    dueTodayTasks: tasks.filter(
      (task) => !task.completed && task.dueDate && isSameUtcDate(task.dueDate, new Date())
    ).length,
    completionRate:
      tasks.length === 0
        ? 0
        : Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100)
  };

  return {
    summary,
    urgentTasks: tasks.filter((task) => !task.completed).sort(compareTasks).slice(0, 6),
    recentCompletions: tasks
      .filter((task) => task.completed && task.completedAt)
      .sort(
        (left, right) =>
          new Date(right.completedAt ?? right.updatedAt).getTime() -
          new Date(left.completedAt ?? left.updatedAt).getTime()
      )
      .slice(0, 6)
  };
}
