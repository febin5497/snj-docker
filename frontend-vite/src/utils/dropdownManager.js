/**
 * Global Dropdown State Manager
 * Provides utilities to manage dropdown state across the entire application
 */

// Store all dropdown state getters and setters
const dropdownStates = new Map();

/**
 * Register a dropdown state setter
 * @param {string} key - Unique key for the dropdown
 * @param {function} setter - State setter function
 */
export function registerDropdown(key, setter) {
  dropdownStates.set(key, setter);
}

/**
 * Unregister a dropdown
 * @param {string} key - Dropdown key to remove
 */
export function unregisterDropdown(key) {
  dropdownStates.delete(key);
}

/**
 * Reset all registered dropdowns to their default values
 */
export function resetAllDropdowns() {
  dropdownStates.forEach((setter) => {
    if (typeof setter === 'function') {
      setter(''); // Reset to empty string or could pass a default value
    }
  });
}

/**
 * Reset a specific dropdown
 * @param {string} key - Dropdown key to reset
 * @param {any} defaultValue - Default value to reset to (default: '')
 */
export function resetDropdown(key, defaultValue = '') {
  const setter = dropdownStates.get(key);
  if (setter && typeof setter === 'function') {
    setter(defaultValue);
  }
}

/**
 * Get all registered dropdown keys
 */
export function getRegisteredDropdowns() {
  return Array.from(dropdownStates.keys());
}

/**
 * Clear all dropdown registrations (useful on app cleanup)
 */
export function clearDropdownRegistry() {
  dropdownStates.clear();
}

/**
 * Hook to automatically reset dropdown on unmount
 * Usage: useAutoResetDropdown('myDropdown', setMyDropdown)
 */
export function useAutoResetDropdown(key, setter, defaultValue = '') {
  // Register on mount
  if (typeof window !== 'undefined') {
    registerDropdown(key, setter);
  }

  // Unregister on unmount
  return () => {
    unregisterDropdown(key);
  };
}
