import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { recordSpotActivity } from "./activity.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { removeImage } from "./storage.js";
import type { AuthUser, SpotPhoto, SpotResponse, SpotRow } from "./types.js";

const seedSpots = [
  {
    title: "Monteliusvagen Outlook",
    note: "Warm light over the water and the quietest five minutes of the day.",
    latitude: 59.3197,
    longitude: 18.0583,
    favorited: true
  },
  {
    title: "Rosendals Garden",
    note: "Coffee, gravel paths, and the kind of afternoon that makes the city feel slower.",
    latitude: 59.3247,
    longitude: 18.1459,
    favorited: false
  },
  {
    title: "Skeppsholmen Walk",
    note: "Windy, bright, and worth it for the skyline view back toward the old town.",
    latitude: 59.3252,
    longitude: 18.0918,
    favorited: true
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

async function getSpotPhotos(spotIds: string[]) {
  if (spotIds.length === 0) {
    return new Map<string, SpotPhoto[]>();
  }

  const result = await pool.query<{
    id: string;
    spot_id: string;
    storage_key: string;
    image_url: string;
    created_at: string;
  }>(
    `
      SELECT id, spot_id, storage_key, image_url, created_at
      FROM spot_photos
      WHERE spot_id = ANY($1::text[])
      ORDER BY created_at ASC
    `,
    [spotIds]
  );

  const grouped = new Map<string, SpotPhoto[]>();

  for (const row of result.rows) {
    const current = grouped.get(row.spot_id) ?? [];
    current.push({
      id: row.id,
      storageKey: row.storage_key,
      imageUrl: row.image_url,
      createdAt: row.created_at
    });
    grouped.set(row.spot_id, current);
  }

  return grouped;
}

function toSpotResponse(spot: SpotRow, photos: SpotPhoto[] = []): SpotResponse {
  return {
    id: spot.id,
    title: spot.title,
    note: spot.note,
    latitude: spot.latitude,
    longitude: spot.longitude,
    favorited: spot.favorited,
    createdAt: spot.created_at,
    updatedAt: spot.updated_at,
    photos
  };
}

export async function initializeStore() {
  const existing = await getUserByEmail("ebba@example.com");

  if (existing) {
    return;
  }

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

  for (const seed of seedSpots) {
    const id = randomUUID();
    await pool.query(
      `
        INSERT INTO spots (
          id,
          user_id,
          title,
          note,
          latitude,
          longitude,
          favorited,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NULL)
      `,
      [
        id,
        userId,
        seed.title,
        seed.note,
        seed.latitude,
        seed.longitude,
        seed.favorited,
        createdAt
      ]
    );
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

export async function listSpots(
  userId: string,
  filters: { search?: string; favorited?: boolean }
) {
  const values: unknown[] = [userId];
  const where = [`user_id = $1`, `deleted_at IS NULL`];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim().toLowerCase()}%`);
    where.push(`LOWER(title || ' ' || note) LIKE $${values.length}`);
  }

  if (typeof filters.favorited === "boolean") {
    values.push(filters.favorited);
    where.push(`favorited = $${values.length}`);
  }

  const result = await pool.query<SpotRow>(
    `
      SELECT id, user_id, title, note, latitude, longitude, favorited, created_at, updated_at, deleted_at
      FROM spots
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
    `,
    values
  );

  const photosBySpot = await getSpotPhotos(result.rows.map((row: SpotRow) => row.id));

  return result.rows.map((row: SpotRow) =>
    toSpotResponse(row, photosBySpot.get(row.id) ?? [])
  );
}

export async function getSpot(userId: string, spotId: string) {
  const result = await pool.query<SpotRow>(
    `
      SELECT id, user_id, title, note, latitude, longitude, favorited, created_at, updated_at, deleted_at
      FROM spots
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      LIMIT 1
    `,
    [spotId, userId]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const photosBySpot = await getSpotPhotos([row.id]);
  return toSpotResponse(row, photosBySpot.get(row.id) ?? []);
}

export async function createSpot(
  userId: string,
  input: {
    title: string;
    note?: string;
    latitude: number;
    longitude: number;
    favorited?: boolean;
    photos?: SpotPhoto[];
  }
) {
  const client = await pool.connect();
  const id = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO spots (
          id,
          user_id,
          title,
          note,
          latitude,
          longitude,
          favorited,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NULL)
      `,
      [
        id,
        userId,
        input.title.trim(),
        input.note?.trim() ?? "",
        input.latitude,
        input.longitude,
        input.favorited ?? false,
        timestamp
      ]
    );

    for (const photo of input.photos ?? []) {
      await client.query(
        `
          INSERT INTO spot_photos (id, spot_id, storage_key, image_url, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          photo.id || randomUUID(),
          id,
          photo.storageKey,
          photo.imageUrl,
          photo.createdAt || timestamp
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const created = await getSpot(userId, id);

  if (!created) {
    throw new Error("SPOT_CREATE_FAILED");
  }

  await recordSpotActivity({
    userId,
    spotId: created.id,
    title: created.title,
    type: "created"
  });

  return created;
}

export async function updateSpot(
  userId: string,
  spotId: string,
  input: Partial<Pick<SpotResponse, "title" | "note" | "favorited" | "latitude" | "longitude">>
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof input.title === "string") {
    values.push(input.title.trim());
    fields.push(`title = $${values.length}`);
  }

  if (typeof input.note === "string") {
    values.push(input.note.trim());
    fields.push(`note = $${values.length}`);
  }

  if (typeof input.favorited === "boolean") {
    values.push(input.favorited);
    fields.push(`favorited = $${values.length}`);
  }

  if (typeof input.latitude === "number") {
    values.push(input.latitude);
    fields.push(`latitude = $${values.length}`);
  }

  if (typeof input.longitude === "number") {
    values.push(input.longitude);
    fields.push(`longitude = $${values.length}`);
  }

  if (fields.length === 0) {
    return getSpot(userId, spotId);
  }

  values.push(new Date().toISOString());
  fields.push(`updated_at = $${values.length}`);
  values.push(spotId);
  values.push(userId);

  const result = await pool.query(
    `
      UPDATE spots
      SET ${fields.join(", ")}
      WHERE id = $${values.length - 1} AND user_id = $${values.length} AND deleted_at IS NULL
    `,
    values
  );

  if (result.rowCount === 0) {
    return null;
  }

  const updated = await getSpot(userId, spotId);

  if (updated) {
    await recordSpotActivity({
      userId,
      spotId: updated.id,
      title: updated.title,
      type: "updated"
    });
  }

  return updated;
}

export async function softDeleteSpot(userId: string, spotId: string) {
  const result = await pool.query<{
    id: string;
    title: string;
  }>(
    `
      UPDATE spots
      SET deleted_at = $1, updated_at = $1
      WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
      RETURNING id, title
    `,
    [new Date().toISOString(), spotId, userId]
  );

  const deleted = result.rows[0];

  if (!deleted) {
    return false;
  }

  await recordSpotActivity({
    userId,
    spotId: deleted.id,
    title: deleted.title,
    type: "deleted"
  });

  return true;
}

export async function removeSpotPhoto(userId: string, spotId: string, photoId: string) {
  const result = await pool.query<{
    storage_key: string;
  }>(
    `
      DELETE FROM spot_photos
      WHERE id = $1
        AND spot_id = $2
        AND EXISTS (
          SELECT 1
          FROM spots
          WHERE spots.id = $2
            AND spots.user_id = $3
            AND spots.deleted_at IS NULL
        )
      RETURNING storage_key
    `,
    [photoId, spotId, userId]
  );

  const row = result.rows[0];

  if (!row) {
    return false;
  }

  await removeImage(row.storage_key);
  return true;
}
