'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import BrutalButton from '@/components/BrutalButton';
import BrutalPanel from '@/components/BrutalPanel';

/* ============================================
   LANDING PAGE — Smart Life Inbox
   Neo-Brutalist broken grid with Stitch tokens
   ============================================ */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    { label: "RAW INPUT", text: "Voice Note: 'Remind me to pay the electricity bill of $45 by next Friday'", color: 'text-brutal-coral' },
    { label: "AI PIPELINE", text: "[STT_LOGGED] -> [ENTITIES_EXTRACTED: 'electricity bill', '$45', 'next Friday']", color: 'text-brutal-yellow' },
    { label: "STRUCTURED TASK", text: "Task: Pay Electricity Bill\nAmount: $45\nDue: Next Friday\nPriority: High\nCategory: Finance", color: 'text-brutal-lime' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep(s => (s + 1) % demoSteps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [demoSteps.length]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPercent = (clientX / innerWidth - 0.5) * 2;
      const yPercent = (clientY / innerHeight - 0.5) * 2;
      heroRef.current.style.transform = `perspective(1000px) rotateY(${xPercent * 1.5}deg) rotateX(${-yPercent * 1.5}deg)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-brutal-yellow">
      {/* ===== NAVIGATION ===== */}
      <nav className="flex items-center justify-between px-8 py-4 border-b-3 border-brutal-ink bg-brutal-offwhite">
        <Link href="/" className="font-headline font-bold text-2xl text-brutal-ink tracking-tight uppercase">
          Smart Life Inbox
        </Link>

        <div className="hidden md:flex items-center gap-3">
          {['Features', 'Dashboard', 'Upload'].map((item) => (
            <Link
              key={item}
              href={item === 'Features' ? '#features' : `/${item.toLowerCase()}`}
              className="brutal-sticker bg-brutal-offwhite hover:bg-brutal-yellow transition-colors"
            >
              {item}
            </Link>
          ))}
          <Link href="/dashboard">
            <BrutalButton variant="secondary" size="sm">
              Get Started
            </BrutalButton>
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION — Broken Grid ===== */}
      <section className="px-6 md:px-12 py-12 md:py-20">
        <div ref={heroRef} className="transition-transform duration-300 ease-out">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
            {/* Main Headline — Spans 7 columns */}
            <div className="md:col-span-7">
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-headline font-bold leading-[0.95] text-brutal-ink mb-8">
                STOP
                <br />
                FORGETTING
                <br />
                IMPORTANT
                <br />
                <span className="relative inline-block">
                  THINGS.
                  <span className="absolute -bottom-2 left-0 w-full h-2 bg-brutal-coral" />
                </span>
              </h1>

              <Link href="/dashboard">
                <BrutalButton variant="secondary" size="lg" className="mt-4">
                  Start Organizing Now →
                </BrutalButton>
              </Link>
            </div>

            {/* Right Info Block — Spans 5 columns, offset down */}
            <div className="md:col-span-5 md:mt-16">
              <BrutalPanel color="coral" shadow="lg" className="mb-6">
                <p className="font-body text-lg leading-relaxed">
                  Your AI-powered life admin assistant. Drop in bills, receipts, voice memos, screenshots —
                  and let AI turn chaos into organized action.
                </p>
              </BrutalPanel>

              <div className="brutal-border brutal-shadow bg-brutal-ink p-6 relative overflow-hidden text-brutal-offwhite min-h-[220px]">
                <div className="font-mono text-xs font-bold text-brutal-offwhite/50 uppercase tracking-widest mb-4 border-b-2 border-brutal-offwhite/20 pb-2">
                  Live AI Translation Demo
                </div>
                <div className="h-32 relative">
                  {demoSteps.map((s, i) => (
                    <div key={i} className={`absolute inset-0 transition-opacity duration-300 ${i === demoStep ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                      <div className={`font-headline text-sm font-bold uppercase mb-2 ${s.color}`}>{s.label}</div>
                      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{s.text}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  {demoSteps.map((_, i) => (
                    <div key={i} className={`h-2 flex-1 border border-brutal-offwhite ${i === demoStep ? 'bg-brutal-offwhite' : 'bg-brutal-offwhite/10'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE BLOCKS — Asymmetric ===== */}
      <section id="features" className="px-6 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* Block 1 — Tall & Narrow */}
          <div className="md:col-span-3 md:row-span-2">
            <BrutalPanel color="coral" shadow="lg" className="h-full min-h-[320px] flex flex-col justify-between">
              <div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">
                  CAPTURE
                </h2>
                <p className="font-body text-base leading-relaxed">
                  Drop anything — photos of bills, voice memos, screenshots, emails.
                  AI extracts the important stuff automatically.
                </p>
              </div>
              <div className="font-mono text-xs mt-8 uppercase tracking-widest opacity-60">
                01 / 03
              </div>
            </BrutalPanel>
          </div>

          {/* Block 2 — Wide & Short */}
          <div className="md:col-span-6">
            <BrutalPanel color="purple" shadow="lg" className="min-h-[200px]">
              <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">
                ORGANIZE
              </h2>
              <p className="font-body text-base leading-relaxed max-w-lg">
                AI categorizes, prioritizes, and creates tasks. Bills get due dates.
                Appointments get reminders. Nothing falls through the cracks.
              </p>
              <div className="font-mono text-xs mt-6 uppercase tracking-widest opacity-60">
                02 / 03
              </div>
            </BrutalPanel>
          </div>

          {/* Block 3 — Medium, offset position */}
          <div className="md:col-span-3 md:mt-12">
            <BrutalPanel color="lavender" shadow="lg" className="min-h-[240px] flex flex-col justify-between">
              <div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">
                  ACT
                </h2>
                <p className="font-body text-base leading-relaxed">
                  Get a daily briefing. AI tells you what to do first.
                  Check things off and move on with your life.
                </p>
              </div>
              <div className="font-mono text-xs mt-6 uppercase tracking-widest opacity-60">
                03 / 03
              </div>
            </BrutalPanel>
          </div>

          <div className="md:col-span-9 md:col-start-4">
            <div className="brutal-border brutal-shadow-lg bg-brutal-ink text-brutal-offwhite p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-brutal-yellow mb-2">
                  Powered by AI
                </div>
                <h3 className="font-headline font-bold text-2xl">
                  YOUR PERSONAL LIFE ADMIN ASSISTANT
                </h3>
              </div>
              <Link href="/dashboard" className="shrink-0">
                <BrutalButton variant="secondary" size="md">
                  Try It Now
                </BrutalButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Before / After comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 max-w-5xl mx-auto">
          <div className="brutal-border brutal-shadow-lg bg-brutal-offwhite p-6 border-l-[12px] border-l-brutal-coral">
            <div className="font-headline text-xl font-bold uppercase mb-4 text-brutal-coral">Before SLI</div>
            <ul className="font-mono text-sm space-y-3 text-brutal-ink/70">
              <li>- 5 ignored unread emails</li>
              <li>- Screenshots of receipts lost in gallery</li>
              <li>- Forgot to cancel trial (charged $12)</li>
              <li>- "I'll do it later" mental debt</li>
            </ul>
          </div>
          <div className="brutal-border brutal-shadow-lg bg-brutal-offwhite p-6 border-l-[12px] border-l-brutal-lime">
            <div className="font-headline text-xl font-bold uppercase mb-4 text-brutal-ink">After SLI</div>
            <ul className="font-mono text-sm space-y-3 font-bold">
              <li>[DONE] Trial canceled (Reminder triggered)</li>
              <li>[CAPTURED] Receipts categorized to Finance</li>
              <li>[PLANNED] Priority task list generated daily</li>
              <li>[OPTIMAL] Zero mental debt</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-brutal-ink text-brutal-offwhite px-8 py-6 border-t-3 border-brutal-offwhite">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-headline font-bold text-sm uppercase tracking-widest">
            Smart Life Inbox — 2026
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-brutal-offwhite/60">
            Built with AI. Designed with intention.
          </div>
        </div>
      </footer>
    </div>
  );
}
