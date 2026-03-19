import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import type { AuthUser, SessionRecord, SpotPhoto, SpotRecord, SpotResponse } from "./types.js";

type UserRecord = AuthUser & {
  passwordHash: string;
};

const users = new Map<string, UserRecord>();
const usersByEmail = new Map<string, UserRecord>();
const sessions = new Map<string, SessionRecord>();
const spots = new Map<string, SpotRecord>();

const seedSpots = [
  {
    title: "Monteliusvagen Outlook",
    note: "Warm light over the water and the quietest five minutes of the day.",
    latitude: 59.3197,
    longitude: 18.0583,
    favorited: true,
    accent: "montelius"
  },
  {
    title: "Rosendals Garden",
    note: "Coffee, gravel paths, and the kind of afternoon that makes the city feel slower.",
    latitude: 59.3247,
    longitude: 18.1459,
    favorited: false,
    accent: "rosendal"
  },
  {
    title: "Skeppsholmen Walk",
    note: "Windy, bright, and worth it for the skyline view back toward the old town.",
    latitude: 59.3252,
    longitude: 18.0918,
    favorited: true,
    accent: "skeppsholmen"
  }
] as const;

let defaultUserSeeded = false;

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function passwordsMatch(password: string, storedHash: string) {
  const incoming = Buffer.from(hashPassword(password));
  const stored = Buffer.from(storedHash);

  if (incoming.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(incoming, stored);
}

function buildSeedPhotos(spotId: string, accent: string): SpotPhoto[] {
  return [
    {
      id: randomUUID(),
      imageUrl: `https://images.osaas.local/${accent}/1.jpg`,
      storageKey: `seed/${spotId}/${accent}-1.jpg`,
      createdAt: new Date().toISOString()
    },
    {
      id: randomUUID(),
      imageUrl: `https://images.osaas.local/${accent}/2.jpg`,
      storageKey: `seed/${spotId}/${accent}-2.jpg`,
      createdAt: new Date().toISOString()
    }
  ];
}

function seedSpotsForUser(userId: string) {
  for (const template of seedSpots) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    spots.set(id, {
      id,
      userId,
      title: template.title,
      note: template.note,
      latitude: template.latitude,
      longitude: template.longitude,
      favorited: template.favorited,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
      photos: buildSeedPhotos(id, template.accent)
    });
  }
}

function ensureDefaultUser() {
  if (defaultUserSeeded || usersByEmail.has("ebba@example.com")) {
    defaultUserSeeded = true;
    return;
  }

  const user: UserRecord = {
    id: randomUUID(),
    email: "ebba@example.com",
    passwordHash: hashPassword("secret12"),
    createdAt: new Date().toISOString()
  };

  users.set(user.id, user);
  usersByEmail.set(user.email, user);
  seedSpotsForUser(user.id);
  defaultUserSeeded = true;
}

export function createUser(email: string, password: string) {
  ensureDefaultUser();
  const normalizedEmail = email.trim().toLowerCase();

  if (usersByEmail.has(normalizedEmail)) {
    throw new Error("EMAIL_EXISTS");
  }

  const user: UserRecord = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.set(user.id, user);
  usersByEmail.set(user.email, user);
  seedSpotsForUser(user.id);

  return toAuthUser(user);
}

export function loginUser(email: string, password: string) {
  ensureDefaultUser();
  const normalizedEmail = email.trim().toLowerCase();
  const user = usersByEmail.get(normalizedEmail);

  if (!user || !passwordsMatch(password, user.passwordHash)) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return toAuthUser(user);
}

export function createSession(userId: string) {
  const session: SessionRecord = {
    token: randomUUID(),
    userId,
    createdAt: new Date().toISOString()
  };

  sessions.set(session.token, session);

  return session.token;
}

export function getUserByToken(token: string) {
  ensureDefaultUser();
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  const user = users.get(session.userId);
  return user ? toAuthUser(user) : null;
}

export function listSpots(userId: string, filters: { search?: string; favorited?: boolean }) {
  ensureDefaultUser();
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return Array.from(spots.values())
    .filter((spot) => spot.userId === userId && spot.deletedAt === null)
    .filter((spot) => {
      if (filters.favorited === undefined) {
        return true;
      }

      return spot.favorited === filters.favorited;
    })
    .filter((spot) => {
      if (!normalizedSearch) {
        return true;
      }

      return `${spot.title} ${spot.note}`.toLowerCase().includes(normalizedSearch);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSpotResponse);
}

export function getSpot(userId: string, spotId: string) {
  ensureDefaultUser();
  const spot = spots.get(spotId);

  if (!spot || spot.userId !== userId || spot.deletedAt !== null) {
    return null;
  }

  return toSpotResponse(spot);
}

export function createSpot(
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
  ensureDefaultUser();
  const timestamp = new Date().toISOString();
  const id = randomUUID();

  const spot: SpotRecord = {
    id,
    userId,
    title: input.title.trim(),
    note: input.note?.trim() ?? "",
    latitude: input.latitude,
    longitude: input.longitude,
    favorited: input.favorited ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    photos: input.photos ?? []
  };

  spots.set(id, spot);

  return toSpotResponse(spot);
}

export function updateSpot(
  userId: string,
  spotId: string,
  input: Partial<Pick<SpotRecord, "title" | "note" | "favorited" | "latitude" | "longitude">>
) {
  ensureDefaultUser();
  const spot = spots.get(spotId);

  if (!spot || spot.userId !== userId || spot.deletedAt !== null) {
    return null;
  }

  if (typeof input.title === "string") {
    spot.title = input.title.trim();
  }

  if (typeof input.note === "string") {
    spot.note = input.note.trim();
  }

  if (typeof input.favorited === "boolean") {
    spot.favorited = input.favorited;
  }

  if (typeof input.latitude === "number") {
    spot.latitude = input.latitude;
  }

  if (typeof input.longitude === "number") {
    spot.longitude = input.longitude;
  }

  spot.updatedAt = new Date().toISOString();

  return toSpotResponse(spot);
}

export function softDeleteSpot(userId: string, spotId: string) {
  ensureDefaultUser();
  const spot = spots.get(spotId);

  if (!spot || spot.userId !== userId || spot.deletedAt !== null) {
    return false;
  }

  spot.deletedAt = new Date().toISOString();
  spot.updatedAt = spot.deletedAt;

  return true;
}

function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

function toSpotResponse(spot: SpotRecord): SpotResponse {
  return {
    id: spot.id,
    title: spot.title,
    note: spot.note,
    latitude: spot.latitude,
    longitude: spot.longitude,
    favorited: spot.favorited,
    createdAt: spot.createdAt,
    updatedAt: spot.updatedAt,
    photos: spot.photos
  };
}
