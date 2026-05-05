import { apiClient } from './client';

export type TaskCategory = 'Finance' | 'Health' | 'Legal' | 'Home' | 'Work' | 'Personal';
export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'snoozed' | 'archived';

// ────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────────────────────

export interface TaskCreate {
  task_name: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  due_date?: string;
  notes?: string;
  suggested_action?: string;
}

export interface TaskUpdate {
  task_name?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  notes?: string;
  suggested_action?: string;
  needs_review?: boolean;
}

export interface TaskResponse {
  id: string;
  user_id: string;
  task_name: string;
  category: TaskCategory | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  suggested_action: string | null;
  source_file_id: string | null;
  xp_value: number;
  confidence_score: number | null;
  needs_review: boolean;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  due_before?: string;
  due_after?: string;
  limit?: number;
  offset?: number;
}

export interface TaskSummary {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  total: number;
}

// ────────────────────────────────────────────────────────────
// API FUNCTIONS
// ────────────────────────────────────────────────────────────

export async function getTasks(filters?: TaskFilters): Promise<TaskResponse[]> {
  const { data } = await apiClient.get<TaskResponse[]>('/tasks', { params: filters });
  return data;
}

export async function getTasksToday(): Promise<TaskResponse[]> {
  const { data } = await apiClient.get<TaskResponse[]>('/tasks/today');
  return data;
}

export async function createTask(taskData: TaskCreate): Promise<TaskResponse> {
  const { data } = await apiClient.post<TaskResponse>('/tasks', taskData);
  return data;
}

export async function updateTask(
  id: string,
  taskData: TaskUpdate
): Promise<TaskResponse> {
  const { data } = await apiClient.patch<TaskResponse>(`/tasks/${id}`, taskData);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export async function completeTask(id: string): Promise<TaskResponse> {
  const { data } = await apiClient.patch<TaskResponse>(`/tasks/${id}/complete`);
  return data;
}

export async function snoozeTask(
  id: string,
  snoozeUntil: string
): Promise<TaskResponse> {
  const { data } = await apiClient.patch<TaskResponse>(`/tasks/${id}/snooze`, {
    snooze_until: snoozeUntil,
  });
  return data;
}

export async function reopenTask(id: string): Promise<TaskResponse> {
  const { data } = await apiClient.patch<TaskResponse>(`/tasks/${id}/reopen`);
  return data;
}

export async function getOverdueTasks(): Promise<TaskResponse[]> {
  const { data } = await apiClient.get<TaskResponse[]>('/tasks/overdue');
  return data;
}

export async function getUpcomingTasks(): Promise<TaskResponse[]> {
  const { data } = await apiClient.get<TaskResponse[]>('/tasks/upcoming');
  return data;
}

export async function getTaskSummary(): Promise<TaskSummary> {
  const { data } = await apiClient.get<TaskSummary>('/tasks/summary');
  return data;
}
