import type { TaskUrgency } from "../types/api";

export type DuePreset = "none" | "today" | "tomorrow" | "this-week" | "next-week" | "custom";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export function formatShortDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function isSameLocalDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatDueDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  const dueDate = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameLocalDate(dueDate, today)) {
    return "Today";
  }

  if (isSameLocalDate(dueDate, tomorrow)) {
    return "Tomorrow";
  }

  if (dueDate.getTime() < today.getTime()) {
    return `Overdue ${formatShortDate(value)}`;
  }

  return formatShortDate(value);
}

export function urgencyLabel(urgency: TaskUrgency) {
  switch (urgency) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}

export function formatCompletion(completed: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((completed / total) * 100)}%`;
}

export function dueDateFromPreset(preset: DuePreset, customValue?: string | null) {
  if (preset === "none") {
    return null;
  }

  if (preset === "custom") {
    return customValue ?? null;
  }

  const date = new Date();
  date.setHours(17, 0, 0, 0);

  if (preset === "tomorrow") {
    date.setDate(date.getDate() + 1);
  }

  if (preset === "this-week") {
    date.setDate(date.getDate() + 3);
  }

  if (preset === "next-week") {
    date.setDate(date.getDate() + 7);
  }

  return date.toISOString();
}

export function presetFromDueDate(value: string | null): DuePreset {
  if (!value) {
    return "none";
  }

  const now = new Date();
  const target = new Date(value);
  const midnightNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const midnightTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  ).getTime();
  const dayDiff = Math.round((midnightTarget - midnightNow) / 86400000);

  switch (dayDiff) {
    case 0:
      return "today";
    case 1:
      return "tomorrow";
    case 3:
      return "this-week";
    case 7:
      return "next-week";
    default:
      return "custom";
  }
}
