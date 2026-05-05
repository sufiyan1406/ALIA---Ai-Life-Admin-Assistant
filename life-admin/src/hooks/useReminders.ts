'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getReminders,
  createReminder as apiCreateReminder,
  deleteReminder as apiDeleteReminder,
  type ReminderResponse,
  type ReminderChannel,
} from '@/lib/api/reminders';

interface UseRemindersReturn {
  reminders: ReminderResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getForTask: (taskId: string) => ReminderResponse[];
  createReminder: (taskId: string, remindAt: string, channel?: ReminderChannel) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  countForTask: (taskId: string) => number;
}

export function useReminders(): UseRemindersReturn {
  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReminders();
      setReminders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reminders';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const getForTask = useCallback(
    (taskId: string) => reminders.filter((r) => r.task_id === taskId),
    [reminders]
  );

  const countForTask = useCallback(
    (taskId: string) => reminders.filter((r) => r.task_id === taskId && !r.sent).length,
    [reminders]
  );

  const createReminder = async (taskId: string, remindAt: string, channel: ReminderChannel = 'in-app') => {
    try {
      const newReminder = await apiCreateReminder({
        task_id: taskId,
        remind_at: remindAt,
        channel,
      });
      setReminders((prev) => [...prev, newReminder].sort(
        (a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create reminder';
      setError(message);
      throw err;
    }
  };

  const deleteReminder = async (id: string) => {
    const snapshot = [...reminders];
    setReminders((prev) => prev.filter((r) => r.id !== id));

    try {
      await apiDeleteReminder(id);
    } catch (err) {
      setReminders(snapshot);
      const message = err instanceof Error ? err.message : 'Failed to delete reminder';
      setError(message);
      throw err;
    }
  };

  return {
    reminders,
    loading,
    error,
    refetch,
    getForTask,
    createReminder,
    deleteReminder,
    countForTask,
  };
}
