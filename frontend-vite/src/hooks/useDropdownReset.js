import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to reset dropdown state on route navigation
 * Clears sessionStorage and localStorage dropdown keys when user navigates
 */
export function useDropdownReset(storageKey) {
  const location = useLocation();

  useEffect(() => {
    // Clear dropdown state on route change
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey);
    }
  }, [location.pathname, storageKey]);

  // Clear on component unmount
  useEffect(() => {
    return () => {
      if (storageKey) {
        sessionStorage.removeItem(storageKey);
      }
    };
  }, [storageKey]);
}

/**
 * Hook to manage dropdown state with automatic clearing
 */
export function useDropdownState(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const location = useLocation();

  // Reset on navigation
  useEffect(() => {
    setValue(initialValue);
  }, [location.pathname, initialValue]);

  const resetValue = () => setValue(initialValue);

  return [value, setValue, resetValue];
}

/**
 * Global dropdown reset utility
 * Call this when navigating or reloading
 */
export function resetAllDropdowns() {
  // Clear all dropdown-related sessionStorage
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.includes('dropdown') || key.includes('filter') || key.includes('select')) {
      sessionStorage.removeItem(key);
    }
  });
}
