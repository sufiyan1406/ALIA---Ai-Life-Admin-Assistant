import { useState } from 'react';
import { AxiosError } from 'axios';
import { aiApi, AIExtractedTask, AIExtractionResponse } from '@/lib/api/ai';

interface ApiErrorBody {
  message?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorBody | undefined)?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useAIExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<AIExtractedTask[]>([]);
  const [metadata, setMetadata] = useState<Omit<AIExtractionResponse, 'tasks'> | null>(null);
  const [sourceFileId, setSourceFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const processInput = async (file: File | null, text: string | null) => {
    setIsExtracting(true);
    setError(null);
    setSuccessCount(null);
    setExtractedTasks([]);
    setMetadata(null);
    setSourceFileId(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (text) {
        formData.append('text', text);
      }

      const data = await aiApi.extractTasks(formData);
      setExtractedTasks(data.tasks);
      setMetadata({
        count: data.count,
        input_type: data.input_type,
        source_file_id: data.source_file_id,
        needs_review_count: data.needs_review_count,
        pages_truncated: data.pages_truncated,
        total_pages: data.total_pages,
      });
      setSourceFileId(data.source_file_id ?? null);
      
      if (data.tasks.length === 0) {
        setError('No actionable tasks were found in the provided input.');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'An unexpected error occurred during extraction.'));
    } finally {
      setIsExtracting(false);
    }
  };

  const updateTask = (index: number, updates: Partial<AIExtractedTask>) => {
    setExtractedTasks((prev) => 
      prev.map((task, i) => i === index ? { ...task, ...updates } : task)
    );
  };

  const removeTask = (index: number) => {
    setExtractedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmTasks = async (onSuccess: () => void) => {
    if (extractedTasks.length === 0) return;
    
    setIsConfirming(true);
    setError(null);
    try {
      const result = await aiApi.confirmTasks(extractedTasks, sourceFileId);
      setSuccessCount(result.length);
      setExtractedTasks([]);
      setMetadata(null);
      setSourceFileId(null);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save tasks.'));
    } finally {
      setIsConfirming(false);
    }
  };

  const resetState = () => {
    setExtractedTasks([]);
    setMetadata(null);
    setSourceFileId(null);
    setError(null);
    setSuccessCount(null);
  };

  return {
    isExtracting,
    isConfirming,
    extractedTasks,
    metadata,
    sourceFileId,
    error,
    successCount,
    processInput,
    updateTask,
    removeTask,
    confirmTasks,
    resetState
  };
}
