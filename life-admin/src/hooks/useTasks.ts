'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  completeTask as apiCompleteTask,
  snoozeTask as apiSnoozeTask,
  reopenTask as apiReopenTask,
  type TaskFilters,
  type TaskResponse,
  type TaskCreate,
  type TaskUpdate,
} from '@/lib/api/tasks';

interface UseTasksReturn {
  tasks: TaskResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (data: TaskCreate) => Promise<void>;
  updateTask: (id: string, data: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, snoozeUntil: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
}

export function useTasks(filters?: TaskFilters): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTasks(filters);
      setTasks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTask = async (taskData: TaskCreate) => {
    // Snapshot
    const snapshot = [...tasks];
    // Optimistic update
    const optimisticTask: TaskResponse = {
      id: `temp-${Date.now()}`,
      user_id: 'temp',
      task_name: taskData.task_name,
      category: taskData.category || null,
      priority: taskData.priority || 'Medium',
      status: 'pending',
      due_date: taskData.due_date || null,
      suggested_action: taskData.suggested_action || null,
      source_file_id: null,
      xp_value: taskData.priority === 'Urgent' ? 40 : taskData.priority === 'High' ? 30 : taskData.priority === 'Low' ? 10 : 20,
      confidence_score: null,
      needs_review: false,
      notes: taskData.notes || null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    
    // Sort logic simplified for optimistic (put at top or maintain sort)
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const realTask = await apiCreateTask(taskData);
      setTasks((prev) => prev.map(t => t.id === optimisticTask.id ? realTask : t));
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  };

  const updateTask = async (id: string, taskData: TaskUpdate) => {
    const snapshot = [...tasks];
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, ...taskData } as TaskResponse : t));

    try {
      const updated = await apiUpdateTask(id, taskData);
      setTasks((prev) => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    const snapshot = [...tasks];
    setTasks((prev) => prev.filter(t => t.id !== id));

    try {
      await apiDeleteTask(id);
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  };

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

  const snoozeTask = async (id: string, snoozeUntil: string) => {
    const snapshot = [...tasks];
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, status: 'snoozed', due_date: snoozeUntil } : t));

    try {
      const updated = await apiSnoozeTask(id, snoozeUntil);
      setTasks((prev) => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  };

  const reopenTask = async (id: string) => {
    const snapshot = [...tasks];
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, status: 'pending', completed_at: null } : t));

    try {
      const updated = await apiReopenTask(id);
      setTasks((prev) => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  };

  return { 
    tasks, loading, error, refetch, 
    createTask, updateTask, deleteTask, completeTask, snoozeTask, reopenTask 
  };
}
