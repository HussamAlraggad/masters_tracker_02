/**
 * Hook for course sync functionality
 */

'use client';

import { useState, useCallback } from 'react';
import type { Course } from '@/types';

export interface SyncResult {
  success: boolean;
  imported: number;
  updated: number;
  message: string;
}

export interface UseCourseSyncReturn {
  sync: (majorId: string) => Promise<SyncResult>;
  isLoading: boolean;
  error: string | null;
  lastResult: SyncResult | null;
}

export function useCourseSync(): UseCourseSyncReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const sync = useCallback(async (majorId: string): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courses/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ majorId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      const result: SyncResult = {
        success: true,
        imported: data.imported,
        updated: data.updated,
        message: data.message || `Sync complete: ${data.imported} imported, ${data.updated} updated`,
      };

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      const result: SyncResult = {
        success: false,
        imported: 0,
        updated: 0,
        message: errorMsg,
      };
      setLastResult(result);
      return result;
    } finally {
      // Don't set isLoading to false immediately - let the UI handle it
    }
  }, []);

  return {
    sync,
    isLoading,
    error,
    lastResult,
  };
}