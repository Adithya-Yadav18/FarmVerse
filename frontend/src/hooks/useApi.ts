import { useState, useCallback, useRef, useEffect } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFn: (...args: unknown[]) => Promise<T>,
  immediate = false
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null, loading: false, error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args: unknown[]) => {
    if (!mountedRef.current) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await apiFn(...args);
      if (mountedRef.current) setState({ data: result, loading: false, error: null });
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setState(s => ({ ...s, loading: false, error: message }));
      }
    }
  }, [apiFn]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) { execute(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, execute, reset };
}
