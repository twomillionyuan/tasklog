import { randomUUID } from "node:crypto";

import { config } from "./config.js";

type ActivityEventType = "created" | "updated" | "deleted";

export type ActivityEvent = {
  id: string;
  userId: string;
  spotId: string;
  title: string;
  type: ActivityEventType;
  createdAt: string;
};

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
    console.log("SpotLog startup: CouchDB activity log disabled");
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

export async function recordSpotActivity(input: {
  userId: string;
  spotId: string;
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
        spotId: input.spotId,
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
      fields: ["_id", "userId", "spotId", "title", "type", "createdAt"],
      sort: [
        {
          userId: "asc"
        },
        {
          createdAt: "desc"
        }
      ],
      limit
    })
  });

  const payload = (await response.json()) as {
    docs: Array<{
      _id: string;
      userId: string;
      spotId: string;
      title: string;
      type: ActivityEventType;
      createdAt: string;
    }>;
  };

  return payload.docs.map((doc) => ({
    id: doc._id,
    userId: doc.userId,
    spotId: doc.spotId,
    title: doc.title,
    type: doc.type,
    createdAt: doc.createdAt
  }));
}
