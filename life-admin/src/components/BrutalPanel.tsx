'use client';

import React from 'react';

/* ============================================
   BRUTAL PANEL — Stitch Component
   From: Neo-Brutalist Design System
   Colored block containers with thick borders
   ============================================ */

interface BrutalPanelProps {
  readonly children: React.ReactNode;
  readonly color?: 'yellow' | 'coral' | 'purple' | 'lime' | 'lavender' | 'white' | 'ink';
  readonly shadow?: 'sm' | 'md' | 'lg';
  readonly className?: string;
  readonly title?: string;
}

const colorStyles = {
  yellow: 'bg-brutal-yellow text-brutal-ink',
  coral: 'bg-brutal-coral text-brutal-ink',
  purple: 'bg-brutal-purple text-white',
  lime: 'bg-brutal-lime text-brutal-ink',
  lavender: 'bg-brutal-lavender text-brutal-ink',
  white: 'bg-brutal-offwhite text-brutal-ink',
  ink: 'bg-brutal-ink text-brutal-offwhite',
};

const shadowStyles = {
  sm: 'shadow-[2px_2px_0px_0px_#1A1A1A]',
  md: 'shadow-[4px_4px_0px_0px_#1A1A1A]',
  lg: 'shadow-[8px_8px_0px_0px_#1A1A1A]',
};

export default function BrutalPanel({
  children,
  color = 'white',
  shadow = 'md',
  className = '',
  title,
}: BrutalPanelProps) {
  return (
    <div
      className={`
        brutal-border p-6
        ${colorStyles[color]}
        ${shadowStyles[shadow]}
        ${className}
      `}
    >
      {title && (
        <h3 className="font-headline font-bold text-sm uppercase tracking-widest mb-4 pb-3 border-b-2 border-current">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
