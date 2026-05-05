'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', accent: 'bg-brutal-coral' },
  { label: 'Tasks', href: '/tasks', accent: 'bg-brutal-purple' },
  { label: 'Upload', href: '/upload', accent: 'bg-brutal-lime' },
  { label: 'Settings', href: '/settings', accent: 'bg-brutal-lavender' },
];

export default function BrutalSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="fixed left-0 top-0 z-50 flex h-[76px] w-full items-center justify-between border-b-3 border-brutal-offwhite bg-brutal-ink px-4 md:hidden">
        <Link href="/dashboard" aria-label="Smart Life Inbox dashboard">
          <div className="font-headline text-2xl font-bold tracking-tight text-brutal-yellow">SLI</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-brutal-offwhite/60">Smart Life Inbox</div>
        </Link>
        <div className="flex max-w-[70vw] items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 font-headline text-[10px] font-bold uppercase tracking-wider ${
                pathname === item.href ? 'bg-brutal-lime text-brutal-ink' : 'text-brutal-offwhite'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r-3 border-brutal-offwhite bg-brutal-ink md:flex">
        <Link href="/dashboard" className="block border-b-3 border-brutal-offwhite/20 p-6">
          <div className="font-headline text-3xl font-bold tracking-tight text-brutal-yellow">
            SLI
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-brutal-offwhite/60">
            Smart Life Inbox
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="flex items-center gap-3">
                <span className={`inline-block h-3 w-3 border-2 border-current ${item.accent}`} />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="border-t-3 border-brutal-offwhite/20 p-4">
          {user && (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-brutal-offwhite/40 bg-brutal-coral font-headline text-sm font-bold text-brutal-ink">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-headline text-xs font-bold uppercase tracking-wider text-brutal-offwhite">
                  {displayName}
                </div>
                <div className="truncate font-mono text-[10px] text-brutal-offwhite/50">
                  {displayEmail}
                </div>
              </div>
            </div>
          )}

          <button
            id="sidebar-logout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full cursor-pointer border-2 border-brutal-offwhite/30 bg-brutal-offwhite/10 px-4 py-3 font-headline text-xs font-bold uppercase tracking-wider text-brutal-offwhite transition-all duration-100 hover:border-brutal-ink hover:bg-brutal-coral hover:text-brutal-ink active:translate-y-[1px] disabled:opacity-50"
          >
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
