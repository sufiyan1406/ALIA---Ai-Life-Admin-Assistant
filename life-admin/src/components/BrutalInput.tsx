'use client';

import React from 'react';

/* ============================================
   BRUTAL INPUT — Stitch Component
   From: Neo-Brutalist Design System
   Thick-bordered inputs with yellow focus state
   ============================================ */

interface BrutalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  readonly className?: string;
  readonly label?: string;
}

export default function BrutalInput({
  className = '',
  label,
  ...props
}: BrutalInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block font-headline font-bold text-xs uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full px-4 py-3 bg-brutal-offwhite text-brutal-ink font-body
                   border-2 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                   placeholder:text-brutal-ink/40 placeholder:font-mono placeholder:text-sm
                   focus:bg-brutal-yellow focus:shadow-[6px_6px_0px_0px_#1A1A1A] focus:outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-150"
      />
    </div>
  );
}
