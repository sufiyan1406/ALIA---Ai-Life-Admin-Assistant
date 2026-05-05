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
import { formatDueDate } from '@/utils/dateUtils';
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
        <div className="xl:col-span-8">
          <BrutalPanel color="yellow" shadow="lg" title="Daily Briefing">
            {loading ? (
              <div className="font-headline text-2xl font-bold uppercase">Building briefing...</div>
            ) : (
              <>
                <p className="mb-3 font-body text-xl leading-relaxed">
                  {briefing?.greeting} {briefing?.headline}
                </p>
                <p className="mb-6 border-2 border-brutal-ink bg-brutal-offwhite p-4 font-body text-sm shadow-[3px_3px_0px_0px_#1A1A1A]">
                  {briefing?.insight}
                </p>

                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="border-2 border-brutal-ink bg-brutal-coral px-4 py-3 shadow-[3px_3px_0px_0px_#1A1A1A]">
                    <div className="font-mono text-xs uppercase tracking-wider">Overdue</div>
                    <div className="font-headline text-3xl font-bold">{overdueCount}</div>
                  </div>
                  <div className="border-2 border-brutal-ink bg-brutal-offwhite px-4 py-3 shadow-[3px_3px_0px_0px_#1A1A1A]">
                    <div className="font-mono text-xs uppercase tracking-wider">Today</div>
                    <div className="font-headline text-3xl font-bold">{todayCount}</div>
                  </div>
                  <div className="border-2 border-brutal-ink bg-brutal-lavender px-4 py-3 shadow-[3px_3px_0px_0px_#1A1A1A]">
                    <div className="font-mono text-xs uppercase tracking-wider">Next 3</div>
                    <div className="font-headline text-3xl font-bold">{upcomingCount}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/upload">
                    <BrutalButton variant="primary">Capture Input</BrutalButton>
                  </Link>
                  <Link href="/tasks">
                    <BrutalButton variant="ghost">Manage Tasks</BrutalButton>
                  </Link>
                </div>
              </>
            )}
          </BrutalPanel>
        </div>

        <div className="xl:col-span-4">
          <BrutalPanel color="purple" shadow="lg" title="XP And Streak" className="h-full">
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
        </div>

        <div className="xl:col-span-8">
          <BrutalPanel color="white" shadow="md" title="Focus Queue">
            <div className="flex flex-col gap-3">
              {focusTasks.length === 0 && (
                <div className="border-2 border-brutal-ink bg-brutal-lime p-4 font-body text-sm font-bold">
                  No overdue or due-today tasks. Capture anything new or work ahead from the Tasks page.
                </div>
              )}
              {focusTasks.map((task) => (
                <TaskRow key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </div>
          </BrutalPanel>
        </div>

        <div className="xl:col-span-4">
          <BrutalPanel color="lavender" shadow="md" title="Recent Sources">
            <div className="flex flex-col gap-3">
              {files.slice(0, 4).map((file) => (
                <div key={file.id} className="border-2 border-brutal-ink bg-brutal-offwhite p-4 shadow-[3px_3px_0px_0px_#1A1A1A]">
                  <div className="truncate font-headline text-sm font-bold uppercase">
                    {file.original_filename || `${file.file_type} input`}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <BrutalBadge variant={file.processing_status === 'processed' ? 'success' : 'today'}>
                      {file.processing_status}
                    </BrutalBadge>
                    <span className="font-mono text-xs uppercase text-brutal-ink/50">
                      {file.source_task_count} tasks
                    </span>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="font-body text-sm font-bold text-brutal-ink/60">
                  No source files yet.
                </div>
              )}
            </div>
          </BrutalPanel>
        </div>
      </div>
    </div>
  );
}
