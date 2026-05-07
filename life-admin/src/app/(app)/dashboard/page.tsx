'use client';

import React from 'react';
import Link from 'next/link';
import BrutalBadge from '@/components/BrutalBadge';
import BrutalButton from '@/components/BrutalButton';
import BrutalPanel from '@/components/BrutalPanel';
import { useAuthContext } from '@/context/AuthContext';
import { useBriefing } from '@/hooks/useBriefing';
import { useFiles } from '@/hooks/useFiles';
import { completeTask as completeTaskApi, type TaskResponse } from '@/lib/api/tasks';
import { formatDueDate, isOverdue } from '@/utils/dateUtils';
import { priorityBadgeVariant } from '@/utils/taskUi';

function TaskRow({ task, onComplete }: { task: TaskResponse; onComplete: (id: string) => void }) {
  return (
    <div className={`brutal-card flex items-center gap-4 bg-brutal-offwhite p-4 ${task.priority === 'Urgent' ? 'shadow-[6px_6px_0px_0px_#1A1A1A]' : ''}`}>
      <input
        type="checkbox"
        className="brutal-checkbox cursor-pointer"
        checked={task.status === 'done'}
        onChange={() => onComplete(task.id)}
        disabled={task.status === 'done'}
        aria-label={`Complete ${task.task_name}`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-body text-base font-semibold">{task.task_name}</p>
        {task.suggested_action && (
          <p className="mt-1 line-clamp-2 font-mono text-xs text-brutal-ink/60">
            {task.suggested_action}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase text-brutal-ink/50">
            {formatDueDate(task.due_date) || 'NO DUE DATE'}
          </span>
          <BrutalBadge variant={priorityBadgeVariant(task.priority)}>{task.priority}</BrutalBadge>
          {task.category && <BrutalBadge variant="ai">{task.category}</BrutalBadge>}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { briefing, loading, error, refetch } = useBriefing();
  const { files, refetch: refetchFiles } = useFiles();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const gamification = briefing?.gamification;
  const overdueCount = briefing?.overdue.length ?? 0;
  const todayCount = briefing?.today.length ?? 0;
  const upcomingCount = briefing?.upcoming.length ?? 0;
  const focusTasks = [...(briefing?.overdue ?? []), ...(briefing?.today ?? [])].slice(0, 6);
  const upcomingReminders = briefing?.upcoming_reminders ?? [];
  const recentActivity = briefing?.recent_activity ?? [];

  const handleComplete = async (id: string) => {
    await completeTaskApi(id);
    await Promise.all([refetch(), refetchFiles()]);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold text-brutal-ink md:text-5xl">
            DASHBOARD
          </h1>
          <div className="mt-1 font-mono text-xs uppercase tracking-widest text-brutal-ink/50">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden font-headline text-sm font-bold uppercase tracking-wider text-brutal-ink md:block">
            {displayName}
          </span>
          <div className="flex h-12 w-12 items-center justify-center border-3 border-brutal-ink bg-brutal-coral font-headline text-lg font-bold shadow-[3px_3px_0px_0px_#1A1A1A]">
            {initials}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 border-3 border-brutal-ink bg-brutal-coral p-4 font-body font-bold text-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-6">
          <BrutalPanel color="ink" shadow="md" title="AI Command Center" titleColor="white">
            {loading ? (
              <div className="font-headline text-xl font-bold uppercase text-brutal-offwhite">Running diagnostics...</div>
            ) : (
              <div className="space-y-4 text-brutal-offwhite">
                {overdueCount > 0 && (
                  <div className="flex items-start gap-3 border-l-4 border-brutal-coral pl-3">
                    <span className="font-mono text-sm font-bold text-brutal-coral mt-1">[RISK]</span>
                    <span className="font-body text-base">You have {overdueCount} ignored tasks past their deadline. Prioritize these immediately to avoid compounding debt.</span>
                  </div>
                )}
                {todayCount > 5 && (
                  <div className="flex items-start gap-3 border-l-4 border-brutal-yellow pl-3">
                    <span className="font-mono text-sm font-bold text-brutal-yellow mt-1">[WORKLOAD]</span>
                    <span className="font-body text-base">High task density detected today ({todayCount} tasks). AI recommends focusing on &apos;Urgent&apos; categories first.</span>
                  </div>
                )}
                {upcomingReminders.length > 0 && (
                  <div className="flex items-start gap-3 border-l-4 border-brutal-yellow pl-3">
                    <span className="font-mono text-sm font-bold text-brutal-yellow mt-1">[REMINDERS]</span>
                    <span className="font-body text-base">{upcomingReminders.length} reminder{upcomingReminders.length !== 1 ? 's' : ''} scheduled in the next 24 hours.</span>
                  </div>
                )}
                {upcomingCount > 0 && (
                  <div className="flex items-start gap-3 border-l-4 border-brutal-lime pl-3">
                    <span className="font-mono text-sm font-bold text-brutal-lime mt-1">[AWARENESS]</span>
                    <span className="font-body text-base">{upcomingCount} deadlines looming in the next 3 days.</span>
                  </div>
                )}
                {overdueCount === 0 && todayCount <= 5 && upcomingCount === 0 && upcomingReminders.length === 0 && (
                  <div className="flex items-start gap-3 border-l-4 border-brutal-lime pl-3">
                    <span className="font-mono text-sm font-bold text-brutal-lime mt-1">[OPTIMAL]</span>
                    <span className="font-body text-base">No immediate risks detected. Workload is balanced.</span>
                  </div>
                )}
              </div>
            )}
          </BrutalPanel>

          <BrutalPanel color="yellow" shadow="lg" title="Today's AI Plan">
            {loading ? (
              <div className="font-headline text-xl font-bold uppercase">Building briefing...</div>
            ) : (
              <>
                <p className="mb-6 font-mono text-sm font-bold uppercase tracking-widest text-brutal-ink/60 border-b-2 border-brutal-ink pb-2">
                  AI Prioritized Execution Queue
                </p>

                <div className="flex flex-col gap-3 mb-6">
                  {focusTasks.length === 0 && (
                    <div className="border-2 border-brutal-ink bg-brutal-offwhite p-4 font-body text-sm font-bold">
                      Queue clear. No tasks demanded for today.
                    </div>
                  )}
                  {focusTasks.map((task, index) => (
                    <div key={task.id} className={`brutal-card flex items-start gap-4 p-4 ${task.priority === 'Urgent' || task.priority === 'High' ? 'bg-brutal-coral border-4 shadow-[4px_4px_0px_0px_#1A1A1A]' : 'bg-brutal-offwhite'} hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-transform duration-150`}>
                      <div className="font-headline text-2xl font-bold text-brutal-ink/30 mt-1 w-6">{index + 1}</div>
                      <input
                        type="checkbox"
                        className="brutal-checkbox cursor-pointer mt-1.5 shrink-0"
                        checked={task.status === 'done'}
                        onChange={() => handleComplete(task.id)}
                        disabled={task.status === 'done'}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-base font-bold">{task.task_name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {task.due_date && isOverdue(task.due_date) && task.status !== 'done' && (
                            <BrutalBadge variant="urgent">Overdue</BrutalBadge>
                          )}
                          <BrutalBadge variant={task.due_date && isOverdue(task.due_date) ? "urgent" : "later"}>
                            {formatDueDate(task.due_date) || 'NO DEADLINE'}
                          </BrutalBadge>
                          <BrutalBadge variant={priorityBadgeVariant(task.priority)}>{task.priority}</BrutalBadge>
                          {task.category && <BrutalBadge variant="ai">{task.category}</BrutalBadge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-brutal-ink">
                  <Link href="/upload">
                    <BrutalButton variant="primary">Ingest New Data</BrutalButton>
                  </Link>
                  <Link href="/tasks">
                    <BrutalButton variant="ghost">View Full Backlog</BrutalButton>
                  </Link>
                </div>
              </>
            )}
          </BrutalPanel>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <BrutalPanel color="purple" shadow="lg" title="XP And Streak">
            <div className="space-y-4">
              <div className="border-2 border-white/40 bg-white/10 p-4">
                <div className="font-mono text-xs uppercase tracking-widest">Level {gamification?.level ?? 1}</div>
                <div className="font-headline text-3xl font-bold">{gamification?.level_title ?? 'Admin Rookie'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-white/40 bg-white/10 p-4">
                  <div className="font-mono text-xs uppercase tracking-widest">XP</div>
                  <div className="font-headline text-4xl font-bold">{gamification?.xp_total ?? 0}</div>
                </div>
                <div className="border-2 border-white/40 bg-white/10 p-4">
                  <div className="font-mono text-xs uppercase tracking-widest">Streak</div>
                  <div className="font-headline text-4xl font-bold">{gamification?.streak_current ?? 0}</div>
                </div>
              </div>
              <div className="h-5 border-2 border-white bg-brutal-ink">
                <div
                  className="h-full bg-brutal-lime"
                  style={{
                    width: gamification?.next_level_xp
                      ? `${Math.min(100, Math.round((gamification.xp_total / gamification.next_level_xp) * 100))}%`
                      : '100%',
                  }}
                />
              </div>
              <p className="font-mono text-xs uppercase tracking-wider text-white/80">
                {gamification?.xp_to_next_level === null ? 'Top level reached' : `${gamification?.xp_to_next_level ?? 200} XP to next level`}
              </p>
            </div>
          </BrutalPanel>

          {/* Upcoming Reminders */}
          <BrutalPanel color="coral" shadow="md" title="Upcoming Reminders">
            {loading ? (
              <div className="font-headline text-sm font-bold uppercase">Loading...</div>
            ) : upcomingReminders.length === 0 ? (
              <div className="border-2 border-brutal-ink bg-brutal-offwhite p-3 font-body text-sm font-bold text-brutal-ink/60">
                No reminders scheduled in the next 24 hours.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 border-2 border-brutal-ink bg-brutal-offwhite p-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
                    <span className="text-lg">🔔</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs font-bold uppercase text-brutal-ink/70">
                        {new Date(reminder.remind_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <BrutalBadge variant="today">{reminder.channel}</BrutalBadge>
                  </div>
                ))}
              </div>
            )}
          </BrutalPanel>

          {/* Automation Activity Feed */}
          {recentActivity.length > 0 && (
            <BrutalPanel color="white" shadow="md" title="Recent Activity">
              <div className="space-y-2">
                {recentActivity.slice(0, 6).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 border-b border-brutal-ink/20 pb-2 last:border-b-0">
                    <span className="mt-0.5 text-sm">
                      {activity.event_type === 'reminder_sent' && '✅'}
                      {activity.event_type === 'reminder_failed' && '❌'}
                      {activity.event_type === 'overdue_detected' && '⚠️'}
                      {activity.event_type === 'auto_reminder_created' && '🤖'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-xs font-bold text-brutal-ink leading-tight">{activity.message}</p>
                      <p className="font-mono text-[10px] text-brutal-ink/50 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </BrutalPanel>
          )}
        </div>

        <div className="xl:col-span-12">
          <BrutalPanel color="lavender" shadow="md" title="Ingestion History">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {files.slice(0, 4).map((file) => (
                <div key={file.id} className="border-2 border-brutal-ink bg-brutal-offwhite p-4 shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200">
                  <div className="truncate font-headline text-sm font-bold uppercase">
                    {file.original_filename || `${file.file_type} input`}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <BrutalBadge variant={file.processing_status === 'processed' ? 'success' : 'today'}>
                      {file.processing_status}
                    </BrutalBadge>
                    <span className="font-mono text-[10px] font-bold uppercase text-brutal-ink/60 bg-white border border-brutal-ink px-1.5">
                      {file.source_task_count} TASKS
                    </span>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="font-body text-sm font-bold text-brutal-ink/60 col-span-4 p-4 border-2 border-dashed border-brutal-ink">
                  No source files ingested yet.
                </div>
              )}
            </div>
          </BrutalPanel>
        </div>
      </div>
    </div>
  );
}
