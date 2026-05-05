'use client';

import { useCallback, useEffect, useState } from 'react';
import { getFiles, type SourceFile } from '@/lib/api/files';

export function useFiles() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await getFiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { files, loading, error, refetch };
}
