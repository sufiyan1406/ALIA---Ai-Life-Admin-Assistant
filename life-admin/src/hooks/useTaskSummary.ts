'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTaskSummary, type TaskSummary } from '@/lib/api/tasks';

interface UseTaskSummaryReturn {
  summary: TaskSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTaskSummary(): UseTaskSummaryReturn {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTaskSummary();
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch task summary';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, loading, error, refetch };
}
