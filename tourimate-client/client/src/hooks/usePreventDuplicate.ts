import { useRef } from 'react';

/**
 * Hook to prevent duplicate function calls
 * @param delay - Minimum delay between calls in milliseconds
 * @returns Object with execute function and isExecuting state
 */
export function usePreventDuplicate(delay: number = 1000) {
  const isExecutingRef = useRef(false);
  const lastCallTimeRef = useRef(0);

  const execute = async <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T> | null> => {
    const now = Date.now();
    
    // Check if we're already executing or if not enough time has passed
    if (isExecutingRef.current || (now - lastCallTimeRef.current) < delay) {
      return null;
    }

    isExecutingRef.current = true;
    lastCallTimeRef.current = now;

    try {
      const result = await fn(...args);
      return result;
    } finally {
      isExecutingRef.current = false;
    }
  };

  return {
    execute,
    isExecuting: isExecutingRef.current
  };
}
