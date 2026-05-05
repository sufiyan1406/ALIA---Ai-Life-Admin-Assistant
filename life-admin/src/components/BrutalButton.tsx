'use client';

import React from 'react';

/* ============================================
   BRUTAL BUTTON — Stitch Component
   From: Neo-Brutalist Design System
   Variants: primary (coral), secondary (lime), purple, ghost
   ============================================ */

interface BrutalButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly children: React.ReactNode;
  readonly variant?: 'primary' | 'secondary' | 'purple' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

const variantStyles = {
  primary: 'bg-brutal-coral text-brutal-ink',
  secondary: 'bg-brutal-lime text-brutal-ink',
  purple: 'bg-brutal-purple text-white',
  ghost: 'bg-transparent text-brutal-ink',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function BrutalButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: BrutalButtonProps) {
  return (
    <button
      type={type}
      className={`
        brutal-border brutal-shadow brutal-press
        font-headline font-bold uppercase tracking-wider
        cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#1A1A1A]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
