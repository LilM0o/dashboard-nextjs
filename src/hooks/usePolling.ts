'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UsePollingOptions<T> {
  endpoint: string;
  interval?: number; // ms entre chaque poll (défaut: 30000 = 30s)
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UsePollingReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook centralisé pour le polling des données
 * Gère automatiquement l'intervalle, les erreurs, et le cleanup
 */
export function usePolling<T>({
  endpoint,
  interval = 30000,
  enabled = true,
  onSuccess,
  onError,
}: UsePollingOptions<T>): UsePollingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        onSuccess?.(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, onSuccess, onError]);

  // Fetch initial
  useEffect(() => {
    isMountedRef.current = true;
    
    if (enabled) {
      fetchData();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, enabled]);

  // Setup interval
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled, fetchData]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}

// Hook simplifié pour les endpoints qui ne需要pas de polling automatique
export function useFetch<T>(endpoint: string, dependencies: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(result => {
        if (isMounted) {
          setData(result);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Fetch error'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint, ...dependencies]);

  return { data, isLoading, error };
}
