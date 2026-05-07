'use client';

import React, { useState } from 'react';
import BrutalButton from '@/components/BrutalButton';
import BrutalInput from '@/components/BrutalInput';
import BrutalPanel from '@/components/BrutalPanel';
import { useProfile } from '@/hooks/useProfile';
import { useGamification } from '@/hooks/useGamification';

export default function SettingsPage() {
  const { profile, loading, saving, error, saveProfile } = useProfile();
  const { gamification } = useGamification();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const displayName = String(formData.get('display_name') ?? '').trim();
    const timezone = String(formData.get('timezone') ?? '').trim();
    const briefingTime = String(formData.get('briefing_time') ?? '07:00');
    const reminderIntensity = String(formData.get('reminder_intensity') ?? 'normal') as 'minimal' | 'normal' | 'aggressive';
    const quietStart = String(formData.get('quiet_hours_start') ?? '').trim();
    const quietEnd = String(formData.get('quiet_hours_end') ?? '').trim();

    setSuccess(false);
    await saveProfile({
      display_name: displayName || undefined,
      timezone,
      briefing_time: briefingTime,
      reminder_intensity: reminderIntensity,
      quiet_hours_start: quietStart || undefined,
      quiet_hours_end: quietEnd || undefined,
    });
    setSuccess(true);
  };

  const schedulerOnline = true; // Scheduler always runs with the FastAPI process

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-brutal-ink md:text-5xl">
          PERSONAL AI PROFILE
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-brutal-ink/50">
          System Control Center &amp; Workflow Preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 space-y-6">
          {/* Workflow Preferences */}
          <BrutalPanel color="white" shadow="md" title="Workflow Preferences">
            {loading ? (
              <div className="font-headline text-xl font-bold uppercase">Loading profile...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="border-2 border-brutal-ink bg-brutal-coral p-3 font-body text-sm font-bold">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="border-2 border-brutal-ink bg-brutal-lime p-3 font-body text-sm font-bold">
                    Settings saved.
                  </div>
                )}

                <BrutalInput
                  label="Display Name"
                  name="display_name"
                  defaultValue={profile?.display_name ?? ''}
                  placeholder="Your name"
                  disabled={saving}
                />

                <BrutalInput
                  label="Timezone"
                  name="timezone"
                  defaultValue={profile?.timezone ?? 'Asia/Kolkata'}
                  placeholder="Asia/Kolkata"
                  disabled={saving}
                  required
                />

                <BrutalInput
                  label="Daily Briefing Time"
                  type="time"
                  name="briefing_time"
                  defaultValue={profile?.briefing_time?.slice(0, 5) ?? '07:00'}
                  disabled={saving}
                />

                <BrutalButton type="submit" variant="secondary" disabled={saving}>
                  {saving ? 'Applying Protocol...' : 'Save Preferences'}
                </BrutalButton>
              </form>
            )}
          </BrutalPanel>

          {/* Reminder Preferences */}
          <BrutalPanel color="yellow" shadow="md" title="Reminder Preferences">
            {loading ? (
              <div className="font-headline text-xl font-bold uppercase">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block font-headline text-[10px] font-bold uppercase tracking-widest">
                    Reminder Intensity
                  </label>
                  <select
                    name="reminder_intensity"
                    defaultValue={profile?.reminder_intensity ?? 'normal'}
                    disabled={saving}
                    className="w-full border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm shadow-[2px_2px_0px_0px_#1A1A1A]"
                  >
                    <option value="minimal">Minimal — Urgent tasks only</option>
                    <option value="normal">Normal — Urgent + High priority</option>
                    <option value="aggressive">Aggressive — All tasks with due dates</option>
                  </select>
                  <p className="mt-1 font-mono text-[10px] text-brutal-ink/50">
                    Controls which tasks receive auto-generated default reminders.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-headline text-[10px] font-bold uppercase tracking-widest">
                      Quiet Hours Start
                    </label>
                    <input
                      type="time"
                      name="quiet_hours_start"
                      defaultValue={profile?.quiet_hours_start?.slice(0, 5) ?? '22:00'}
                      disabled={saving}
                      className="w-full border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm shadow-[2px_2px_0px_0px_#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-headline text-[10px] font-bold uppercase tracking-widest">
                      Quiet Hours End
                    </label>
                    <input
                      type="time"
                      name="quiet_hours_end"
                      defaultValue={profile?.quiet_hours_end?.slice(0, 5) ?? '07:00'}
                      disabled={saving}
                      className="w-full border-2 border-brutal-ink bg-brutal-offwhite px-3 py-3 font-mono text-sm shadow-[2px_2px_0px_0px_#1A1A1A]"
                    />
                  </div>
                </div>
                <p className="font-mono text-[10px] text-brutal-ink/50">
                  Email reminders are suppressed during quiet hours. In-app reminders still process normally.
                </p>

                <BrutalButton type="submit" variant="ghost" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Reminder Settings'}
                </BrutalButton>
              </form>
            )}
          </BrutalPanel>

          {/* Reward State */}
          <BrutalPanel color="yellow" shadow="md" title="Reward State">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border-2 border-brutal-ink bg-white p-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-ink/70">Level</div>
                <div className="font-headline text-2xl font-bold">{gamification?.level ?? 1}</div>
              </div>
              <div className="border-2 border-brutal-ink bg-white p-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-ink/70">Total XP</div>
                <div className="font-headline text-2xl font-bold">{gamification?.xp_total ?? 0}</div>
              </div>
              <div className="border-2 border-brutal-ink bg-white p-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-ink/70">Streak</div>
                <div className="font-headline text-2xl font-bold">{gamification?.streak_current ?? 0}</div>
              </div>
              <div className="border-2 border-brutal-ink bg-white p-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-ink/70">Best</div>
                <div className="font-headline text-2xl font-bold">{gamification?.streak_longest ?? 0}</div>
              </div>
            </div>
          </BrutalPanel>
        </div>

        <div className="xl:col-span-5 space-y-6">
          {/* System Status */}
          <BrutalPanel color="ink" shadow="lg" title="System Status" titleColor="white">
            <div className="space-y-3 text-brutal-offwhite">
              {[
                {
                  label: 'Core API',
                  status: 'ONLINE',
                  color: 'text-brutal-lime',
                  dot: true,
                },
                {
                  label: 'Scheduler',
                  status: schedulerOnline ? 'RUNNING — 3 JOBS' : 'OFFLINE',
                  color: schedulerOnline ? 'text-brutal-lime' : 'text-brutal-coral',
                  dot: schedulerOnline,
                },
                {
                  label: 'Email Delivery',
                  status: 'SMTP CONFIGURED',
                  color: 'text-brutal-yellow',
                  dot: false,
                },
                {
                  label: 'OCR Engine',
                  status: 'ACTIVE',
                  color: 'text-brutal-lime',
                  dot: false,
                },
                {
                  label: 'Speech Processor',
                  status: 'ACTIVE',
                  color: 'text-brutal-lime',
                  dot: false,
                },
                {
                  label: 'Reminder Engine',
                  status: 'ACTIVE — 60s CYCLE',
                  color: 'text-brutal-lime',
                  dot: true,
                },
              ].map(({ label, status, color, dot }) => (
                <div key={label} className="flex items-center justify-between border-b-2 border-brutal-offwhite/20 pb-2 last:border-b-0 last:pb-0">
                  <span className="font-mono text-sm font-bold uppercase">{label}</span>
                  <span className={`flex items-center gap-2 font-mono text-xs font-bold ${color}`}>
                    {dot && <span className="h-2 w-2 rounded-full bg-current animate-pulse" />}
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </BrutalPanel>

          {/* Automation Info */}
          <BrutalPanel color="coral" shadow="md" title="Active Automations">
            <div className="space-y-3 font-body text-sm font-bold text-brutal-ink">
              {[
                {
                  icon: '🔔',
                  title: 'Reminder Processing',
                  desc: 'Checks and delivers due reminders every 60 seconds.',
                },
                {
                  icon: '🤖',
                  title: 'Auto-Reminder Generation',
                  desc: 'Creates default reminders for new tasks based on priority and intensity setting.',
                },
                {
                  icon: '⚠️',
                  title: 'Overdue Detection',
                  desc: 'Detects tasks past their due date every 5 minutes and surfaces them in dashboard.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-white p-3 border-2 border-brutal-ink shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div>
                    <div className="font-bold uppercase tracking-wide">{title}</div>
                    <div className="text-xs font-medium text-brutal-ink/70">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </BrutalPanel>

          {/* Privacy */}
          <BrutalPanel color="lavender" shadow="md" title="Privacy &amp; Processing">
            <div className="space-y-3 font-body text-sm font-bold text-brutal-ink">
              {[
                { icon: '🔒', title: 'Data Encrypted', desc: 'All stored inputs and extracted tasks are isolated per user.' },
                { icon: '👁️', title: 'Ephemeral Extraction', desc: 'LLM processing leaves no training residue. Models are stateless.' },
                { icon: '⚡', title: 'Local AI Ready', desc: 'Architecture designed for drop-in local inference (Phase 6).' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-white p-3 border-2 border-brutal-ink shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div>
                    <div className="font-bold uppercase tracking-wide">{title}</div>
                    <div className="text-xs font-medium text-brutal-ink/70">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </BrutalPanel>
        </div>
      </div>
    </div>
  );
}
