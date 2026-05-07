import { apiClient } from './client';
import type { GamificationState } from './gamification';
import type { ReminderResponse } from './reminders';
import type { TaskResponse } from './tasks';

export interface ReminderActivity {
  event_type: string;
  message: string;
  timestamp: string;
  task_id: string | null;
}

export interface DailyBriefing {
  briefing_date: string;
  greeting: string;
  headline: string;
  insight: string;
  overdue: TaskResponse[];
  today: TaskResponse[];
  upcoming: TaskResponse[];
  gamification: GamificationState | null;
  upcoming_reminders: ReminderResponse[];
  recent_activity: ReminderActivity[];
}

export async function getTodayBriefing(): Promise<DailyBriefing> {
  const { data } = await apiClient.get<DailyBriefing>('/briefings/today');
  return data;
}
