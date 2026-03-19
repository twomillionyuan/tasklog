export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type SpotPhoto = {
  id: string;
  imageUrl: string;
  storageKey: string;
  createdAt: string;
};

export type Spot = {
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
