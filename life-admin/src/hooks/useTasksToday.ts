'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTasksToday, completeTask as apiCompleteTask, type TaskResponse } from '@/lib/api/tasks';

interface UseTasksTodayReturn {
  tasks: TaskResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  completeTask: (id: string) => Promise<void>;
}

export function useTasksToday(): UseTasksTodayReturn {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTasksToday();
      setTasks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch today tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const completeTask = async (id: string) => {
    const snapshot = [...tasks];
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t));

    try {
      const updated = await apiCompleteTask(id);
      setTasks((prev) => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  };

  return { tasks, loading, error, refetch, completeTask };
}
