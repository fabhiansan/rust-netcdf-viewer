import { useState, useCallback } from 'react';
import { invoke, type InvokeArgs } from '@tauri-apps/api/core';

interface UseTauriCommandResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (args?: InvokeArgs) => Promise<T | null>;
  reset: () => void;
}

export function useTauriCommand<T>(
  command: string
): UseTauriCommandResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (args?: InvokeArgs): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await invoke<T>(command, args);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [command]
  );

  const reset = useCallback((): void => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
