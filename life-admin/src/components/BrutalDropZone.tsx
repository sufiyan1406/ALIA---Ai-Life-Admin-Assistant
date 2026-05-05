'use client';

import React, { useState, useRef } from 'react';

/* ============================================
   BRUTAL DROP ZONE — Stitch Component
   From: Neo-Brutalist Design System
   Large drop zone with thick dashed border
   ============================================ */

interface BrutalDropZoneProps {
  readonly onFileDrop?: (files: FileList) => void;
  readonly className?: string;
}

export default function BrutalDropZone({
  onFileDrop,
  className = '',
}: BrutalDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0 && onFileDrop) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileDrop) {
      onFileDrop(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        brutal-dropzone cursor-pointer flex flex-col items-center justify-center
        min-h-[400px] p-12 text-center transition-all duration-150
        ${isDragging ? 'bg-brutal-lime border-solid border-brutal-ink' : 'bg-brutal-yellow'}
        ${className}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Icon */}
      <div className="w-24 h-24 border-4 border-brutal-ink mb-8 flex items-center justify-center bg-brutal-offwhite">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-brutal-ink">
          <path d="M24 6L24 34" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
          <path d="M14 16L24 6L34 16" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
          <path d="M8 42H40" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
        </svg>
      </div>

      <h2 className={`font-headline font-bold text-3xl md:text-5xl uppercase mb-4 transition-colors ${isDragging ? 'text-brutal-ink' : 'text-brutal-ink'}`}>
        {isDragging ? 'RELEASE TO UPLOAD' : 'DROP FILES HERE'}
      </h2>

      <p className="font-mono text-sm text-brutal-ink/60 uppercase tracking-wider">
        or click to browse your files
      </p>
    </div>
  );
}
