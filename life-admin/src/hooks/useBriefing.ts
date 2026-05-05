'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTodayBriefing, type DailyBriefing } from '@/lib/api/briefings';

export function useBriefing() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBriefing(await getTodayBriefing());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch briefing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { briefing, loading, error, refetch };
}
