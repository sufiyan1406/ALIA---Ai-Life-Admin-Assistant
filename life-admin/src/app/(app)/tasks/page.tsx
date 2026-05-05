'use client';

import React, { useMemo, useState } from 'react';
import BrutalBadge from '@/components/BrutalBadge';
import BrutalButton from '@/components/BrutalButton';
import BrutalInput from '@/components/BrutalInput';
import BrutalPanel from '@/components/BrutalPanel';
import { useGamification } from '@/hooks/useGamification';
import { useReminders } from '@/hooks/useReminders';
import { useTasks } from '@/hooks/useTasks';
import {
  type TaskCategory,
  type TaskCreate,
  type TaskFilters,
  type TaskPriority,
  type TaskResponse,
  type TaskStatus,
  type TaskUpdate,
} from '@/lib/api/tasks';
import type { ReminderResponse } from '@/lib/api/reminders';
import { formatDueDate, isOverdue } from '@/utils/dateUtils';
import { priorityBadgeVariant, statusLabel } from '@/utils/taskUi';

const categories: TaskCategory[] = ['Finance', 'Health', 'Legal', 'Home', 'Work', 'Personal'];
const priorities: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const statuses: TaskStatus[] = ['pending', 'in_progress', 'snoozed', 'done', 'archived'];

// ────────────────────────────────────────────────────────────
// REMINDER HELPERS
// ────────────────────────────────────────────────────────────

function formatReminderDate(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) return 'Past';
  if (diffHours < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m`;
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

// ────────────────────────────────────────────────────────────
// TASK CARD
// ────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: TaskResponse;
  taskReminders: ReminderResponse[];
  reminderCount: number;
  onComplete: (id: string) => Promise<void>;
  onUpdate: (id: string, update: TaskUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSnooze: (id: string, date: string) => Promise<void>;
  onReopen: (id: string) => Promise<void>;
  onAddReminder: (taskId: string, remindAt: string) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

function TaskCard({
  task,
  taskReminders,
  reminderCount,
  onComplete,
  onUpdate,
  onDelete,
  onSnooze,
  onReopen,
  onAddReminder,
  onDeleteReminder,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [taskName, setTaskName] = useState(task.task_name);
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [category, setCategory] = useState<TaskCategory | ''>(task.category ?? '');
  const [notes, setNotes] = useState(task.notes ?? '');
  const [snoozeDate, setSnoozeDate] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');

  const handleSave = async () => {
    await onUpdate(task.id, {
      task_name: taskName.trim(),
      due_date: dueDate || undefined,
      priority,
      category: category || undefined,
      notes: notes || undefined,
    });
    setIsEditing(false);
  };

  const handleAddReminder = async () => {
    if (!newReminderDate) return;
    await onAddReminder(task.id, new Date(newReminderDate).toISOString());
    setNewReminderDate('');
  };

  const isDone = task.status === 'done';
  const isArchived = task.status === 'archived';

  return (
    <div className={`brutal-card bg-brutal-offwhite p-5 ${isDone || isArchived ? 'opacity-60' : ''} ${isOverdue(task.due_date) && !isDone ? 'border-l-[10px] border-l-brutal-coral' : ''}`}>
      {isEditing ? (
        <div className="space-y-4">
          <BrutalInput label="Task Name" value={taskName} onChange={(event) => setTaskName(event.target.value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <BrutalInput label="Due Date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <label>
              <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Priority</span>
              <select className="w-full border-2 border-brutal-ink bg-white px-3 py-3 font-mono text-sm" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                {priorities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Category</span>
              <select className="w-full border-2 border-brutal-ink bg-white px-3 py-3 font-mono text-sm" value={category} onChange={(event) => setCategory(event.target.value as TaskCategory | '')}>
                <option value="">Uncategorized</option>
                {categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          {/* ── Reminder Management (inside edit mode) ── */}
          <div className="border-2 border-brutal-ink bg-brutal-lavender/20 p-4">
            <span className="mb-3 block font-headline text-xs font-bold uppercase tracking-widest">🔔 Reminders</span>
            {taskReminders.length > 0 ? (
              <div className="mb-3 space-y-2">
                {taskReminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-brutal-ink bg-white px-3 py-2">
                    <span className="font-mono text-xs">
                      {new Date(r.remind_at).toLocaleString()} {r.sent && <span className="text-brutal-ink/40">(sent)</span>}
                    </span>
                    <button
                      onClick={() => onDeleteReminder(r.id)}
                      className="ml-2 border border-brutal-ink bg-brutal-coral px-2 py-0.5 font-mono text-xs font-bold transition-shadow hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 font-mono text-xs text-brutal-ink/50">No reminders set.</p>
            )}
            <div className="flex items-end gap-2">
              <BrutalInput
                label="Add Reminder"
                type="datetime-local"
                value={newReminderDate}
                onChange={(event) => setNewReminderDate(event.target.value)}
                className="flex-1"
              />
              <BrutalButton size="sm" variant="purple" onClick={handleAddReminder} disabled={!newReminderDate}>
                + Add
              </BrutalButton>
            </div>
          </div>

          <label>
            <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Notes</span>
            <textarea
              className="min-h-20 w-full border-2 border-brutal-ink bg-white px-4 py-3 font-body text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <BrutalButton variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</BrutalButton>
            <BrutalButton variant="secondary" size="sm" onClick={handleSave} disabled={!taskName.trim()}>Save</BrutalButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <input
            type="checkbox"
            className="brutal-checkbox mt-1 cursor-pointer"
            checked={isDone}
            onChange={() => onComplete(task.id)}
            disabled={isDone || isArchived}
            aria-label={`Complete ${task.task_name}`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {task.needs_review && <BrutalBadge variant="today">Needs Review</BrutalBadge>}
              {isOverdue(task.due_date) && !isDone && <BrutalBadge variant="urgent">Overdue</BrutalBadge>}
              <BrutalBadge variant={priorityBadgeVariant(task.priority)}>{task.priority}</BrutalBadge>
              <BrutalBadge variant={isDone ? 'success' : 'later'}>{statusLabel(task.status)}</BrutalBadge>
              {task.category && <BrutalBadge variant="ai">{task.category}</BrutalBadge>}

              {/* ── Bell icon with reminder count ── */}
              {reminderCount > 0 && (
                <button
                  onClick={() => setShowReminders((v) => !v)}
                  className="relative inline-flex items-center border border-brutal-ink bg-brutal-yellow px-2 py-0.5 font-mono text-xs font-bold transition-shadow hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
                  title={`${reminderCount} active reminder(s)`}
                >
                  🔔 {reminderCount}
                </button>
              )}
            </div>

            <p className={`mt-3 font-body text-lg font-semibold ${isDone ? 'line-through' : ''}`}>
              {task.task_name}
            </p>
            <div className="mt-2 font-mono text-xs uppercase text-brutal-ink/50">
              {formatDueDate(task.due_date) || 'NO DUE DATE'} | {task.xp_value} XP
            </div>

            {/* ── Inline reminder preview (collapsed by default) ── */}
            {showReminders && taskReminders.length > 0 && (
              <div className="mt-3 border-2 border-brutal-ink bg-brutal-lavender/20 p-3">
                <p className="mb-2 font-headline text-xs font-bold uppercase tracking-widest">Upcoming Reminders</p>
                <div className="space-y-1">
                  {taskReminders.filter((r) => !r.sent).map((r) => (
                    <div key={r.id} className="flex items-center justify-between font-mono text-xs">
                      <span>⏰ {new Date(r.remind_at).toLocaleString()}</span>
                      <span className="text-brutal-ink/50">in {formatReminderDate(r.remind_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.suggested_action && (
              <p className="mt-3 border-2 border-brutal-ink bg-brutal-yellow/40 p-3 font-body text-sm">
                {task.suggested_action}
              </p>
            )}
            {task.notes && (
              <p className="mt-2 font-body text-sm text-brutal-ink/70">{task.notes}</p>
            )}

            {!isDone && !isArchived && (
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <BrutalInput
                  label="Snooze Until"
                  type="date"
                  value={snoozeDate}
                  onChange={(event) => setSnoozeDate(event.target.value)}
                  className="w-full sm:w-48"
                />
                <BrutalButton size="sm" variant="purple" onClick={() => onSnooze(task.id, snoozeDate)} disabled={!snoozeDate}>
                  Snooze
                </BrutalButton>
              </div>
            )}
          </div>

          <div className="flex flex-row gap-2 md:flex-col">
            <BrutalButton size="sm" variant="ghost" onClick={() => setIsEditing(true)} disabled={isArchived}>Edit</BrutalButton>
            {isDone || isArchived ? (
              <BrutalButton size="sm" variant="secondary" onClick={() => onReopen(task.id)}>Reopen</BrutalButton>
            ) : (
              <BrutalButton size="sm" variant="ghost" onClick={() => onUpdate(task.id, { status: 'archived' })}>Archive</BrutalButton>
            )}
            <BrutalButton size="sm" variant="primary" onClick={() => onDelete(task.id)}>Delete</BrutalButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TASKS PAGE
// ────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | ''>('');
  const [formError, setFormError] = useState('');
  const [newTask, setNewTask] = useState<TaskCreate>({
    task_name: '',
    priority: 'Medium',
    category: undefined,
    due_date: undefined,
    notes: '',
  });

  const filters = useMemo<TaskFilters>(() => ({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    limit: 100,
  }), [categoryFilter, priorityFilter, statusFilter]);

  const {
    tasks,
    loading,
    error,
    createTask,
    completeTask,
    updateTask,
    deleteTask,
    snoozeTask,
    reopenTask,
  } = useTasks(filters);
  const { refetch: refetchGamification } = useGamification();
  const {
    getForTask,
    countForTask,
    createReminder,
    deleteReminder: deleteReminderApi,
  } = useReminders();

  const activeCount = tasks.filter((task) => task.status !== 'done' && task.status !== 'archived').length;
  const urgentTasks = tasks.filter((task) => task.priority === 'Urgent' && task.status !== 'done' && task.status !== 'archived');
  const todayTasks = tasks.filter((task) => task.priority !== 'Urgent' && task.status !== 'done' && task.status !== 'archived' && (formatDueDate(task.due_date) === 'TODAY' || isOverdue(task.due_date)));
  const laterTasks = tasks.filter((task) => task.status !== 'done' && task.status !== 'archived' && !urgentTasks.includes(task) && !todayTasks.includes(task));
  const completedTasks = tasks.filter((task) => task.status === 'done' || task.status === 'archived');

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!newTask.task_name.trim()) {
      setFormError('Task name is required.');
      return;
    }
    await createTask({
      ...newTask,
      task_name: newTask.task_name.trim(),
      notes: newTask.notes?.trim() || undefined,
    });
    setNewTask({ task_name: '', priority: 'Medium', category: undefined, due_date: undefined, notes: '' });
    setShowForm(false);
  };

  const handleComplete = async (id: string) => {
    await completeTask(id);
    await refetchGamification();
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm('Delete this task permanently?');
    if (shouldDelete) await deleteTask(id);
  };

  const renderTaskCard = (task: TaskResponse) => (
    <TaskCard
      key={task.id}
      task={task}
      taskReminders={getForTask(task.id)}
      reminderCount={countForTask(task.id)}
      onComplete={handleComplete}
      onUpdate={updateTask}
      onDelete={handleDelete}
      onSnooze={snoozeTask}
      onReopen={reopenTask}
      onAddReminder={createReminder}
      onDeleteReminder={deleteReminderApi}
    />
  );

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-headline text-4xl font-bold text-brutal-ink md:text-5xl">
            TASKS
          </h1>
          <div className="brutal-sticker bg-brutal-coral font-headline text-lg font-bold text-brutal-ink">
            {activeCount}
          </div>
        </div>
        <BrutalButton variant="secondary" size="sm" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Cancel' : '+ New Task'}
        </BrutalButton>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <select className="border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TaskStatus | '')}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
        <select className="border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | '')}>
          <option value="">All priorities</option>
          {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <select className="border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as TaskCategory | '')}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-6 border-3 border-brutal-ink bg-brutal-coral p-4 font-bold text-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8">
          <BrutalPanel color="white" shadow="md" title="Create New Task">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && <div className="border-2 border-brutal-ink bg-brutal-coral p-3 font-bold">{formError}</div>}
              <BrutalInput
                label="Task Name"
                value={newTask.task_name}
                onChange={(event) => setNewTask((task) => ({ ...task, task_name: event.target.value }))}
                placeholder="What needs to be done?"
                required
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <BrutalInput
                  label="Due Date"
                  type="date"
                  value={newTask.due_date ?? ''}
                  onChange={(event) => setNewTask((task) => ({ ...task, due_date: event.target.value || undefined }))}
                />
                <label>
                  <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Priority</span>
                  <select className="w-full border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm" value={newTask.priority} onChange={(event) => setNewTask((task) => ({ ...task, priority: event.target.value as TaskPriority }))}>
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Category</span>
                  <select className="w-full border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm" value={newTask.category ?? ''} onChange={(event) => setNewTask((task) => ({ ...task, category: event.target.value ? event.target.value as TaskCategory : undefined }))}>
                    <option value="">Uncategorized</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>
              <label>
                <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Notes</span>
                <textarea
                  className="min-h-20 w-full border-2 border-brutal-ink bg-brutal-offwhite px-4 py-3 font-body text-sm shadow-[4px_4px_0px_0px_#1A1A1A]"
                  value={newTask.notes ?? ''}
                  onChange={(event) => setNewTask((task) => ({ ...task, notes: event.target.value }))}
                />
              </label>
              <BrutalButton type="submit" variant="primary" disabled={!newTask.task_name.trim()}>
                Create Task
              </BrutalButton>
            </form>
          </BrutalPanel>
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div className="p-12 text-center font-headline text-xl font-bold uppercase">Loading tasks...</div>
      ) : (
        <div className="space-y-8">
          {urgentTasks.length > 0 && (
            <BrutalPanel color="coral" shadow="lg" title={`Urgent (${urgentTasks.length})`}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {urgentTasks.map(renderTaskCard)}
              </div>
            </BrutalPanel>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <BrutalPanel color="yellow" shadow="md" title={`Today (${todayTasks.length})`}>
                <div className="space-y-4">
                  {todayTasks.length === 0 && <p className="font-body text-sm font-bold text-brutal-ink/60">No tasks due today.</p>}
                  {todayTasks.map(renderTaskCard)}
                </div>
              </BrutalPanel>
            </div>
            <div className="xl:col-span-5">
              <BrutalPanel color="lavender" shadow="md" title={`Later (${laterTasks.length})`}>
                <div className="space-y-4">
                  {laterTasks.length === 0 && <p className="font-body text-sm font-bold text-brutal-ink/60">No later tasks in this view.</p>}
                  {laterTasks.map(renderTaskCard)}
                </div>
              </BrutalPanel>
            </div>
          </div>

          {completedTasks.length > 0 && (
            <BrutalPanel color="white" shadow="md" title={`Completed And Archived (${completedTasks.length})`}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {completedTasks.map(renderTaskCard)}
              </div>
            </BrutalPanel>
          )}
        </div>
      )}
    </div>
  );
}
