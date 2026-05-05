'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
  type UserProfileUpdate,
} from '@/lib/api/users';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getUserProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProfile = async (update: UserProfileUpdate) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserProfile(update);
      setProfile(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, saving, error, refetch, saveProfile };
}
