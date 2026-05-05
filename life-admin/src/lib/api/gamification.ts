import { apiClient } from './client';

export interface GamificationState {
  id: string;
  user_id: string;
  xp_total: number;
  level: number;
  level_title: string;
  next_level_xp: number | null;
  xp_to_next_level: number | null;
  streak_current: number;
  streak_longest: number;
  streak_last_date: string | null;
  streak_freezes: number;
  badges: unknown[];
  daily_missions: unknown[];
}

export async function getGamification(): Promise<GamificationState> {
  const { data } = await apiClient.get<GamificationState>('/gamification/me');
  return data;
}
