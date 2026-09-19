import { useState, useEffect } from "react";

/**
 * Returns a value that updates after `delayMs` of stability.
 * Used to reduce rapid API churn on search/filter param changes.
 */
export function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
