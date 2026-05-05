'use client';

import React, { useState } from 'react';
import BrutalBadge from '@/components/BrutalBadge';
import BrutalButton from '@/components/BrutalButton';
import BrutalDropZone from '@/components/BrutalDropZone';
import BrutalInput from '@/components/BrutalInput';
import BrutalPanel from '@/components/BrutalPanel';
import { useAIExtraction } from '@/hooks/useAIExtraction';
import { useFiles } from '@/hooks/useFiles';
import { useTasks } from '@/hooks/useTasks';
import type { TaskCategory, TaskPriority } from '@/lib/api/tasks';

const categories: TaskCategory[] = ['Finance', 'Health', 'Legal', 'Home', 'Work', 'Personal'];
const priorities: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];

export default function UploadPage() {
  const {
    isExtracting,
    isConfirming,
    extractedTasks,
    metadata,
    error,
    successCount,
    processInput,
    updateTask,
    removeTask,
    confirmTasks,
    resetState,
  } = useAIExtraction();
  const { refetch: refetchTasks } = useTasks();
  const { files, refetch: refetchFiles } = useFiles();
  const [textInput, setTextInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileDrop = (filesList: FileList) => {
    setLocalError(null);
    if (filesList.length > 1) {
      setLocalError('MVP intake processes one file at a time. Please upload the first file, then continue with the next.');
      return;
    }
    if (filesList[0]) {
      processInput(filesList[0], null);
    }
  };

  const handleTextSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!textInput.trim()) {
      setLocalError('Paste or type some text before processing.');
      return;
    }
    await processInput(null, textInput.trim());
  };

  const handleConfirm = () => {
    confirmTasks(async () => {
      await Promise.all([refetchTasks(), refetchFiles()]);
      setTextInput('');
    });
  };

  if (extractedTasks.length > 0) {
    return (
      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-headline text-4xl font-bold text-brutal-ink md:text-5xl">
              REVIEW TASKS
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-brutal-ink/50">
              AI extracted {extractedTasks.length} tasks from {metadata?.input_type}.
            </p>
          </div>
          <BrutalButton variant="ghost" onClick={resetState}>
            Discard All
          </BrutalButton>
        </div>

        {error && (
          <div className="mb-6 border-2 border-brutal-ink bg-brutal-coral p-4 font-mono text-sm font-bold">
            {error}
          </div>
        )}

        {metadata?.pages_truncated && (
          <div className="mb-6 flex items-center gap-3 border-2 border-brutal-ink bg-brutal-yellow p-4 font-body text-sm font-bold shadow-[4px_4px_0px_0px_#1A1A1A]">
            <span className="font-headline text-xl font-bold">!</span>
            Only the first 10 pages of your {metadata.total_pages}-page PDF were processed.
          </div>
        )}

        <div className="mb-8 space-y-6">
          {extractedTasks.map((task, index) => (
            <div
              key={`${task.task_name}-${index}`}
              className={`brutal-card p-6 ${task.needs_review ? 'border-4 border-dashed bg-brutal-yellow' : 'bg-brutal-offwhite'}`}
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {task.needs_review && <BrutalBadge variant="today">Review Recommended</BrutalBadge>}
                {task.confidence_score !== null && task.confidence_score !== undefined && (
                  <span className="font-mono text-xs uppercase tracking-widest text-brutal-ink/50">
                    Confidence {Math.round(task.confidence_score * 100)}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                <div className="space-y-4 md:col-span-7">
                  <BrutalInput
                    label="Task Name"
                    value={task.task_name}
                    onChange={(event) => updateTask(index, { task_name: event.target.value })}
                  />

                  <label className="block">
                    <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Suggested Action</span>
                    <textarea
                      value={task.suggested_action ?? ''}
                      onChange={(event) => updateTask(index, { suggested_action: event.target.value })}
                      className="min-h-24 w-full border-2 border-brutal-ink bg-brutal-offwhite px-4 py-3 font-body text-sm shadow-[4px_4px_0px_0px_#1A1A1A] focus:bg-brutal-yellow focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Notes</span>
                    <textarea
                      value={task.notes ?? ''}
                      onChange={(event) => updateTask(index, { notes: event.target.value })}
                      className="min-h-20 w-full border-2 border-brutal-ink bg-brutal-offwhite px-4 py-3 font-body text-sm shadow-[4px_4px_0px_0px_#1A1A1A] focus:bg-brutal-yellow focus:outline-none"
                    />
                  </label>
                </div>

                <div className="space-y-4 md:col-span-5">
                  <BrutalInput
                    label="Due Date"
                    type="date"
                    value={task.due_date ?? ''}
                    onChange={(event) => updateTask(index, { due_date: event.target.value || null })}
                  />

                  <label className="block">
                    <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Priority</span>
                    <select
                      className="w-full border-2 border-brutal-ink bg-white px-3 py-3 font-mono text-sm focus:bg-brutal-yellow focus:outline-none"
                      value={task.priority}
                      onChange={(event) => updateTask(index, { priority: event.target.value as TaskPriority })}
                    >
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-widest">Category</span>
                    <select
                      className="w-full border-2 border-brutal-ink bg-white px-3 py-3 font-mono text-sm focus:bg-brutal-yellow focus:outline-none"
                      value={task.category ?? ''}
                      onChange={(event) => updateTask(index, { category: event.target.value ? event.target.value as TaskCategory : null })}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <button
                    onClick={() => removeTask(index)}
                    className="font-headline text-xs font-bold uppercase text-brutal-coral underline"
                  >
                    Remove Task
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t-4 border-brutal-ink pt-6">
          <BrutalButton
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={isConfirming || extractedTasks.length === 0}
          >
            {isConfirming ? 'Saving Tasks...' : `Confirm And Save ${extractedTasks.length} Tasks`}
          </BrutalButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-brutal-ink md:text-5xl">
          UPLOAD
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-brutal-ink/50">
          Drop a file or paste text. AI turns it into tasks.
        </p>
      </div>

      {successCount !== null && (
        <div className="mb-6 border-2 border-brutal-ink bg-brutal-lime p-4 font-headline text-lg font-bold shadow-[4px_4px_0px_0px_#1A1A1A]">
          Created {successCount} task{successCount === 1 ? '' : 's'}.
        </div>
      )}

      {(error || localError) && (
        <div className="mb-6 border-2 border-brutal-ink bg-brutal-coral p-4 font-mono text-sm font-bold shadow-[4px_4px_0px_0px_#1A1A1A]">
          {error || localError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="relative xl:col-span-8">
          <BrutalDropZone
            onFileDrop={handleFileDrop}
            className={`min-h-[420px] ${isExtracting ? 'pointer-events-none opacity-50' : ''}`}
          />
          {isExtracting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brutal-offwhite">
              <div className="smart-pulse w-full max-w-sm border-4 border-brutal-ink bg-white p-8 shadow-[8px_8px_0px_0px_#1A1A1A]">
                <div className="mb-4 text-center font-headline text-xl font-bold uppercase tracking-widest text-brutal-purple">
                  AI Processing
                </div>
                <p className="mb-6 text-center font-mono text-sm">
                  Reading input, extracting actions, and structuring tasks.
                </p>
                <div className="h-4 overflow-hidden border-2 border-brutal-ink bg-brutal-ink/10">
                  <div className="h-full w-full bg-brutal-purple" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-4">
          <BrutalPanel color="white" shadow="md" title="Paste Text">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <textarea
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                placeholder="Paste an email, message, note, or voice memo transcript..."
                className="min-h-56 w-full border-2 border-brutal-ink bg-brutal-offwhite px-4 py-3 font-body text-sm shadow-[4px_4px_0px_0px_#1A1A1A] placeholder:font-mono placeholder:text-brutal-ink/40 focus:bg-brutal-yellow focus:outline-none"
                disabled={isExtracting}
              />
              <BrutalButton type="submit" variant="secondary" disabled={isExtracting || !textInput.trim()}>
                Process Text
              </BrutalButton>
            </form>
          </BrutalPanel>
        </div>

        <div className="xl:col-span-12">
          <BrutalPanel color="lavender" shadow="md" title="Recent Sources">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {files.slice(0, 6).map((file) => (
                <div key={file.id} className="brutal-card bg-brutal-offwhite p-5">
                  <div className="truncate font-headline text-sm font-bold uppercase tracking-wider">
                    {file.original_filename || `${file.file_type} input`}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <BrutalBadge variant="ai">{file.file_type}</BrutalBadge>
                    <BrutalBadge variant={file.processing_status === 'processed' ? 'success' : 'today'}>
                      {file.processing_status}
                    </BrutalBadge>
                    <span className="font-mono text-xs text-brutal-ink/50">
                      {file.source_task_count} tasks
                    </span>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="font-body text-sm font-bold text-brutal-ink/60">
                  No uploaded sources yet.
                </div>
              )}
            </div>
          </BrutalPanel>
        </div>
      </div>
    </div>
  );
}
