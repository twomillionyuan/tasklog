import type { Spot } from "@/src/types/api";

export type MockSpot = Spot & {
  accentColor: string;
};

export const mockSpots: MockSpot[] = [
  {
    id: "1",
    title: "Monteliusvagen Outlook",
    note: "Warm light over the water and the quietest five minutes of the day.",
    createdAt: "2026-03-19T10:00:00.000Z",
    updatedAt: "2026-03-19T10:00:00.000Z",
    favorited: true,
    latitude: 59.3197,
    longitude: 18.0583,
    photos: [
      {
        id: "1-1",
        imageUrl: "preview://montelius-1",
        storageKey: "preview/montelius-1",
        createdAt: "2026-03-19T10:00:00.000Z"
      },
      {
        id: "1-2",
        imageUrl: "preview://montelius-2",
        storageKey: "preview/montelius-2",
        createdAt: "2026-03-19T10:00:00.000Z"
      }
    ],
    accentColor: "#8AA17B"
  },
  {
    id: "2",
    title: "Rosendals Garden",
    note: "Coffee, gravel paths, and the kind of afternoon that makes the city feel slower.",
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: "2026-03-15T10:00:00.000Z",
    favorited: false,
    latitude: 59.3247,
    longitude: 18.1459,
    photos: [
      {
        id: "2-1",
        imageUrl: "preview://rosendal-1",
        storageKey: "preview/rosendal-1",
        createdAt: "2026-03-15T10:00:00.000Z"
      },
      {
        id: "2-2",
        imageUrl: "preview://rosendal-2",
        storageKey: "preview/rosendal-2",
        createdAt: "2026-03-15T10:00:00.000Z"
      },
      {
        id: "2-3",
        imageUrl: "preview://rosendal-3",
        storageKey: "preview/rosendal-3",
        createdAt: "2026-03-15T10:00:00.000Z"
      }
    ],
    accentColor: "#C8B39B"
  },
  {
    id: "3",
    title: "Skeppsholmen Walk",
    note: "Windy, bright, and worth it for the view back toward the old town skyline.",
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
    favorited: true,
    latitude: 59.3252,
    longitude: 18.0918,
    photos: [
      {
        id: "3-1",
        imageUrl: "preview://skeppsholmen-1",
        storageKey: "preview/skeppsholmen-1",
        createdAt: "2026-03-09T10:00:00.000Z"
      }
    ],
    accentColor: "#93AFA9"
  }
];
