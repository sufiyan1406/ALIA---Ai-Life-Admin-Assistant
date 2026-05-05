import { apiClient } from './client';

// ────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────────────────────

export type ReminderChannel = 'push' | 'email' | 'in-app';

export interface ReminderCreate {
  task_id: string;
  remind_at: string;  // ISO 8601 datetime
  channel?: ReminderChannel;
}

export interface ReminderResponse {
  id: string;
  task_id: string;
  user_id: string;
  remind_at: string;
  channel: string;
  sent: boolean;
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// API FUNCTIONS
// ────────────────────────────────────────────────────────────

export async function getReminders(): Promise<ReminderResponse[]> {
  const { data } = await apiClient.get<ReminderResponse[]>('/reminders');
  return data;
}

export async function createReminder(body: ReminderCreate): Promise<ReminderResponse> {
  const { data } = await apiClient.post<ReminderResponse>('/reminders', body);
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  await apiClient.delete(`/reminders/${id}`);
}
