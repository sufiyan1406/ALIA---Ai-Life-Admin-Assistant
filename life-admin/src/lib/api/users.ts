import { apiClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string;
  briefing_time: string;
  plan: 'free' | 'pro' | 'team';
  created_at: string;
}

export interface UserProfileUpdate {
  display_name?: string;
  timezone?: string;
  briefing_time?: string;
}

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
}

export async function updateUserProfile(update: UserProfileUpdate): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>('/users/me', update);
  return data;
}
