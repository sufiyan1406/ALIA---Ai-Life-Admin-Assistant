import { apiClient } from './client';
import type { GamificationState } from './gamification';
import type { TaskResponse } from './tasks';

export interface DailyBriefing {
  briefing_date: string;
  greeting: string;
  headline: string;
  insight: string;
  overdue: TaskResponse[];
  today: TaskResponse[];
  upcoming: TaskResponse[];
  gamification: GamificationState | null;
}

export async function getTodayBriefing(): Promise<DailyBriefing> {
  const { data } = await apiClient.get<DailyBriefing>('/briefings/today');
  return data;
}
