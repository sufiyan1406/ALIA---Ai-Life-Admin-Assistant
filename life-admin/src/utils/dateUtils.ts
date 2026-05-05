export function formatDueDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'TOMORROW';
  if (diffDays < 7) return dueDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  
  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function isOverdue(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate.getTime() < today.getTime();
}
