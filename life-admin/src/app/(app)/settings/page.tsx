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

    setSuccess(false);
    await saveProfile({
      display_name: displayName || undefined,
      timezone,
      briefing_time: briefingTime,
    });
    setSuccess(true);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-brutal-ink md:text-5xl">
          SETTINGS
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-brutal-ink/50">
          Profile, briefing, and reward state
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <BrutalPanel color="white" shadow="md" title="Profile">
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
                  defaultValue={profile?.briefing_time.slice(0, 5) ?? '07:00'}
                  disabled={saving}
                />

                <BrutalButton type="submit" variant="secondary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </BrutalButton>
              </form>
            )}
          </BrutalPanel>
        </div>

        <div className="xl:col-span-5">
          <BrutalPanel color="purple" shadow="lg" title="Reward State" className="h-full">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-white/40 bg-white/10 p-4">
                <div className="font-mono text-xs uppercase tracking-widest">Level</div>
                <div className="font-headline text-4xl font-bold">{gamification?.level ?? 1}</div>
                <div className="font-body text-sm">{gamification?.level_title ?? 'Admin Rookie'}</div>
              </div>
              <div className="border-2 border-white/40 bg-white/10 p-4">
                <div className="font-mono text-xs uppercase tracking-widest">XP</div>
                <div className="font-headline text-4xl font-bold">{gamification?.xp_total ?? 0}</div>
                <div className="font-body text-sm">
                  {gamification?.xp_to_next_level ?? 200} to next
                </div>
              </div>
              <div className="border-2 border-white/40 bg-white/10 p-4">
                <div className="font-mono text-xs uppercase tracking-widest">Streak</div>
                <div className="font-headline text-4xl font-bold">{gamification?.streak_current ?? 0}</div>
                <div className="font-body text-sm">current days</div>
              </div>
              <div className="border-2 border-white/40 bg-white/10 p-4">
                <div className="font-mono text-xs uppercase tracking-widest">Best</div>
                <div className="font-headline text-4xl font-bold">{gamification?.streak_longest ?? 0}</div>
                <div className="font-body text-sm">longest streak</div>
              </div>
            </div>
          </BrutalPanel>
        </div>
      </div>
    </div>
  );
}
