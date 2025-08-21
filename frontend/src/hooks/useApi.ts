import { useState, useEffect, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UseApiReturn<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await apiFunction(...args);
        
        setState(prev => ({ ...prev, data: result, loading: false }));
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (error: any) {
        const errorMessage = error.message || 'An unexpected error occurred';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        
        if (onError) {
          onError(errorMessage);
        }
        
        return undefined;
      }
    },
    [apiFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    setLoading,
  };
}

// Specialized hook for fetching data on mount
export function useFetch<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  args: any[] = [],
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { execute, ...rest } = useApi(apiFunction, { ...options, immediate: false });

  useEffect(() => {
    execute(...args);
  }, [execute, ...args]);

  return { execute, ...rest };
}

// Specialized hook for mutations (POST, PUT, DELETE)
export function useMutation<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  return useApi(apiFunction, { ...options, immediate: false });
}

export default useApi;