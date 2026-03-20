export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
};

export type SpotPhoto = {
  id: string;
  imageUrl: string;
  storageKey: string;
  createdAt: string;
};

export type SpotRecord = {
  id: string;
  userId: string;
  title: string;
  note: string;
  latitude: number;
  longitude: number;
  favorited: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  photos: SpotPhoto[];
};

export type SpotResponse = {
  id: string;
  title: string;
  note: string;
  latitude: number;
  longitude: number;
  favorited: boolean;
  createdAt: string;
  updatedAt: string;
  photos: SpotPhoto[];
};

export type SpotRow = {
  id: string;
  user_id: string;
  title: string;
  note: string;
  latitude: number;
  longitude: number;
  favorited: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ActivityEvent = {
  id: string;
  userId: string;
  spotId: string;
  title: string;
  type: "created" | "updated" | "deleted";
  createdAt: string;
};
