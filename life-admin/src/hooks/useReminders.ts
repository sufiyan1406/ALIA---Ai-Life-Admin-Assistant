'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getReminders,
  createReminder as apiCreateReminder,
  updateReminder as apiUpdateReminder,
  dismissReminder as apiDismissReminder,
  deleteReminder as apiDeleteReminder,
  type ReminderResponse,
  type ReminderChannel,
  type ReminderUpdate,
} from '@/lib/api/reminders';

interface UseRemindersReturn {
  reminders: ReminderResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getForTask: (taskId: string) => ReminderResponse[];
  createReminder: (taskId: string, remindAt: string, channel?: ReminderChannel) => Promise<void>;
  updateReminder: (id: string, update: ReminderUpdate) => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  countForTask: (taskId: string) => number;
  activeReminders: ReminderResponse[];
  sentReminders: ReminderResponse[];
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
    (taskId: string) => reminders.filter((r) => r.task_id === taskId && r.status === 'pending').length,
    [reminders]
  );

  const activeReminders = reminders.filter((r) => r.status === 'pending');

  const sentReminders = reminders.filter((r) => r.status === 'sent');

  const createReminder = async (taskId: string, remindAt: string, channel: ReminderChannel = 'email') => {
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

  const updateReminder = async (id: string, update: ReminderUpdate) => {
    try {
      const updated = await apiUpdateReminder(id, update);
      setReminders((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update reminder';
      setError(message);
      throw err;
    }
  };

  const dismissReminder = async (id: string) => {
    try {
      const dismissed = await apiDismissReminder(id);
      setReminders((prev) => prev.map((r) => r.id === id ? dismissed : r));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss reminder';
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
    updateReminder,
    dismissReminder,
    deleteReminder,
    countForTask,
    activeReminders,
    sentReminders,
  };
}
