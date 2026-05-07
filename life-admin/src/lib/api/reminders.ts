import { apiClient } from './client';

// ────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────────────────────

export type ReminderChannel = 'push' | 'email' | 'in-app';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'dismissed';

export interface ReminderCreate {
  task_id: string;
  remind_at: string;  // ISO 8601 datetime
  channel?: ReminderChannel;
}

export interface ReminderUpdate {
  remind_at?: string;
  channel?: ReminderChannel;
}

export interface ReminderResponse {
  id: string;
  task_id: string;
  user_id: string;
  remind_at: string;
  channel: string;
  sent: boolean;
  status: ReminderStatus;
  sent_at: string | null;
  dismissed_at: string | null;
  retry_count: number;
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// API FUNCTIONS
// ────────────────────────────────────────────────────────────

export async function getReminders(): Promise<ReminderResponse[]> {
  const { data } = await apiClient.get<ReminderResponse[]>('/reminders');
  return data;
}

export async function getActiveReminders(): Promise<ReminderResponse[]> {
  const { data } = await apiClient.get<ReminderResponse[]>('/reminders/active');
  return data;
}

export async function createReminder(body: ReminderCreate): Promise<ReminderResponse> {
  const { data } = await apiClient.post<ReminderResponse>('/reminders', body);
  return data;
}

export async function updateReminder(id: string, body: ReminderUpdate): Promise<ReminderResponse> {
  const { data } = await apiClient.patch<ReminderResponse>(`/reminders/${id}`, body);
  return data;
}

export async function dismissReminder(id: string): Promise<ReminderResponse> {
  const { data } = await apiClient.post<ReminderResponse>(`/reminders/${id}/dismiss`);
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  await apiClient.delete(`/reminders/${id}`);
}
