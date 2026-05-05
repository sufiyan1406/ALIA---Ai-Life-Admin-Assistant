import type { BrutalBadgeVariant } from '@/components/BrutalBadge';
import type { TaskPriority, TaskStatus } from '@/lib/api/tasks';

export function priorityBadgeVariant(priority: TaskPriority): BrutalBadgeVariant {
  if (priority === 'Urgent') return 'urgent';
  if (priority === 'High') return 'today';
  if (priority === 'Low') return 'later';
  return 'ai';
}

export function statusLabel(status: TaskStatus): string {
  return status.replace('_', ' ').toUpperCase();
}
