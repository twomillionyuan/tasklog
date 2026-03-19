import { apiUrl } from "./config";
import type { AuthResponse, Spot, SpotPhoto } from "../types/api";

type ApiOptions = {
  token?: string | null;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

async function request<T>(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`
          }
        : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload as T;
}

export function register(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password }
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export async function getSpots(token: string, query?: { search?: string; favorited?: boolean }) {
  const params = new URLSearchParams();

  if (query?.search) {
    params.set("search", query.search);
  }

  if (typeof query?.favorited === "boolean") {
    params.set("favorited", String(query.favorited));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await request<{ spots: Spot[] }>(`/api/spots${suffix}`, {
    token
  });

  return response.spots;
}

export function getSpot(token: string, spotId: string) {
  return request<Spot>(`/api/spots/${spotId}`, {
    token
  });
}

export function createSpot(
  token: string,
  payload: {
    title: string;
    note: string;
    latitude: number;
    longitude: number;
    favorited?: boolean;
    photos?: Spot["photos"];
  }
) {
  return request<Spot>("/api/spots", {
    token,
    method: "POST",
    body: payload
  });
}

export function updateSpot(
  token: string,
  spotId: string,
  payload: Partial<Pick<Spot, "title" | "note" | "favorited" | "latitude" | "longitude">>
) {
  return request<Spot>(`/api/spots/${spotId}`, {
    token,
    method: "PATCH",
    body: payload
  });
}

export function deleteSpot(token: string, spotId: string) {
  return request<null>(`/api/spots/${spotId}`, {
    token,
    method: "DELETE"
  });
}

export async function uploadPhoto(
  token: string,
  asset: {
    uri: string;
    name: string;
    type: string;
  }
) {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.name,
    type: asset.type
  } as never);

  const response = await fetch(`${apiUrl}/api/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const payload = (await response.json()) as SpotPhoto & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Upload failed");
  }

  return payload;
}
