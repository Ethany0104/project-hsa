// src/hooks/useSyncedLocalState.js
import { useState, useEffect } from 'react';

/**
 * A custom hook that keeps a local state in sync with a prop value.
 * When the prop value changes, the local state is updated to match it.
 * @param {*} initialValue - The initial value from props.
 * @returns {[*, Function]} - A stateful value, and a function to update it.
 */
export const useSyncedLocalState = (initialValue) => {
  const [localState, setLocalState] = useState(initialValue);

  useEffect(() => {
    setLocalState(initialValue);
  }, [initialValue]);

  return [localState, setLocalState];
};
