'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a value that updates only after the source value has been stable for `delayMs`.
 * Use for search/filter inputs to avoid firing a request on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
