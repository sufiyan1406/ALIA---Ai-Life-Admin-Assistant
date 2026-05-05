import { apiClient } from './client';
import type { TaskCategory, TaskPriority, TaskResponse } from './tasks';

export interface AIExtractedTask {
  task_name: string;
  category?: TaskCategory | null;
  priority: TaskPriority;
  due_date?: string | null;
  suggested_action?: string | null;
  confidence_score?: number | null;
  needs_review: boolean;
  notes?: string | null;
}

export interface AIExtractionResponse {
  tasks: AIExtractedTask[];
  count: number;
  input_type: string;
  source_file_id?: string | null;
  needs_review_count: number;
  pages_truncated: boolean;
  total_pages?: number | null;
}

export const aiApi = {
  extractTasks: async (formData: FormData): Promise<AIExtractionResponse> => {
    // Let Axios automatically set the multipart/form-data boundary
    const response = await apiClient.post('/ai/extract', formData);
    return response.data;
  },

  confirmTasks: async (tasks: AIExtractedTask[], sourceFileId?: string | null): Promise<TaskResponse[]> => {
    const response = await apiClient.post<TaskResponse[]>('/ai/confirm', {
      tasks,
      source_file_id: sourceFileId ?? null,
    });
    return response.data;
  },
};
