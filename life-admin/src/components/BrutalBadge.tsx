'use client';

import React from 'react';

/* ============================================
   BRUTAL BADGE — Stitch Component
   From: Neo-Brutalist Design System
   Sticker-style priority labels
   ============================================ */

export type BrutalBadgeVariant = 'urgent' | 'today' | 'later' | 'ai' | 'success';

interface BrutalBadgeProps {
  readonly children: React.ReactNode;
  readonly variant?: BrutalBadgeVariant;
  readonly className?: string;
}

const badgeStyles = {
  urgent: 'bg-brutal-coral text-brutal-ink',
  today: 'bg-brutal-yellow text-brutal-ink',
  later: 'bg-brutal-lavender text-brutal-ink',
  ai: 'bg-brutal-purple text-white',
  success: 'bg-brutal-lime text-brutal-ink',
};

export default function BrutalBadge({
  children,
  variant = 'today',
  className = '',
}: BrutalBadgeProps) {
  return (
    <span className={`brutal-sticker ${badgeStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
