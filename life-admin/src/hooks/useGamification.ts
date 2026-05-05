'use client';

import { useCallback, useEffect, useState } from 'react';
import { getGamification, type GamificationState } from '@/lib/api/gamification';

export function useGamification() {
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGamification(await getGamification());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gamification');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { gamification, loading, error, refetch };
}
