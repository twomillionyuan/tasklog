import { randomUUID } from "node:crypto";

import { config } from "./config.js";
import type { ActivityEvent, ActivityEventType } from "./types.js";

function getActivityConfig() {
  if (
    !config.couchDbUrl ||
    !config.couchDbUser ||
    !config.couchDbPassword ||
    !config.couchDbDatabase
  ) {
    return null;
  }

  return {
    baseUrl: config.couchDbUrl.replace(/\/$/, ""),
    database: config.couchDbDatabase,
    authorization: `Basic ${Buffer.from(
      `${config.couchDbUser}:${config.couchDbPassword}`
    ).toString("base64")}`
  };
}

async function couchRequest(path: string, init?: RequestInit) {
  const activityConfig = getActivityConfig();

  if (!activityConfig) {
    throw new Error("ACTIVITY_LOG_DISABLED");
  }

  const response = await fetch(
    `${activityConfig.baseUrl}/${encodeURIComponent(activityConfig.database)}${path}`,
    {
      ...init,
      headers: {
        Authorization: activityConfig.authorization,
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    }
  );

  if (!response.ok && response.status !== 412) {
    const body = await response.text();
    throw new Error(`CouchDB request failed: ${response.status} ${body}`);
  }

  return response;
}

export async function ensureActivityStore() {
  if (!getActivityConfig()) {
    console.log("TaskSnap startup: activity log disabled");
    return;
  }

  await couchRequest("", {
    method: "PUT"
  });

  await couchRequest("/_index", {
    method: "POST",
    body: JSON.stringify({
      index: {
        fields: ["userId", "createdAt"]
      },
      ddoc: "activity-by-user-created-at",
      name: "activity-by-user-created-at",
      type: "json"
    })
  });
}

export async function recordActivity(input: {
  userId: string;
  entityType: "list" | "task";
  entityId: string;
  title: string;
  type: ActivityEventType;
}) {
  if (!getActivityConfig()) {
    return;
  }

  const createdAt = new Date().toISOString();

  try {
    await couchRequest(`/${encodeURIComponent(randomUUID())}`, {
      method: "PUT",
      body: JSON.stringify({
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        title: input.title,
        type: input.type,
        createdAt
      })
    });
  } catch (error) {
    console.error("Failed to record activity event", error);
  }
}

export async function listActivity(userId: string, limit = 20) {
  if (!getActivityConfig()) {
    return [] satisfies ActivityEvent[];
  }

  const response = await couchRequest("/_find", {
    method: "POST",
    body: JSON.stringify({
      selector: {
        userId
      },
      fields: ["_id", "userId", "entityType", "entityId", "title", "type", "createdAt"],
      limit: Math.max(limit, 50)
    })
  });

  const payload = (await response.json()) as {
    docs: Array<{
      _id: string;
      userId: string;
      entityType: "list" | "task";
      entityId: string;
      title: string;
      type: ActivityEventType;
      createdAt: string;
    }>;
  };

  const deduped = payload.docs
    .map((doc) => ({
      id: doc._id,
      userId: doc.userId,
      entityType: doc.entityType,
      entityId: doc.entityId,
      title: doc.title,
      type: doc.type,
      createdAt: doc.createdAt
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .filter((event, index, events) => {
      return (
        index ===
        events.findIndex(
          (candidate) =>
            candidate.entityType === event.entityType &&
            candidate.entityId === event.entityId &&
            candidate.type === event.type
        )
      );
    });

  return deduped.slice(0, limit);
}
