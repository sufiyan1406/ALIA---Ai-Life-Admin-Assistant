import { apiClient } from './client';

export interface SourceFile {
  id: string;
  user_id: string;
  file_type: 'image' | 'pdf' | 'audio' | 'text';
  storage_url: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  processing_status: 'uploaded' | 'processing' | 'processed' | 'failed';
  source_task_count: number;
  raw_text: string | null;
  processed_at: string | null;
  created_at: string;
}

export async function getFiles(): Promise<SourceFile[]> {
  const { data } = await apiClient.get<SourceFile[]>('/files');
  return data;
}
