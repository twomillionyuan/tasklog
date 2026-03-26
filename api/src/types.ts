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

export type TaskUrgency = "low" | "medium" | "high" | "critical";

export type TaskListRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type TaskRow = {
  id: string;
  userId: string;
  listId: string;
  title: string;
  notes: string;
  urgency: TaskUrgency;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TaskResponse = {
  id: string;
  listId: string;
  title: string;
  notes: string;
  urgency: TaskUrgency;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskCounts = {
  total: number;
  open: number;
  completed: number;
  overdue: number;
};

export type TaskListResponse = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  summary: TaskCounts;
  tasks: TaskResponse[];
};

export type DashboardSummary = {
  listCount: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  completionRate: number;
};

export type DashboardResponse = {
  summary: DashboardSummary;
  urgentTasks: TaskResponse[];
  recentCompletions: TaskResponse[];
};
