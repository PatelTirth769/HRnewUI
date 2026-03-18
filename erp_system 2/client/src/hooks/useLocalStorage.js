/**
 * Custom hook for working with localStorage with real-time updates
 * This hook provides methods to store, retrieve, update and delete data in localStorage
 * with real-time updates across components
 */
import { useState, useEffect } from 'react';

// Create a custom event for storage updates
const createStorageEvent = (key, value) => {
  const event = new CustomEvent('local-storage-update', {
    detail: { key, value }
  });
  window.dispatchEvent(event);
};

/**
 * Custom hook for working with localStorage with real-time updates
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Default value if key doesn't exist
 * @returns {[any, Function, Function, Function]} - [storedValue, setValue, removeValue, updateItem]
 */
export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Listen for changes to this localStorage key from other components
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    // Also listen for standard storage events (for cross-tab updates)
    const handleStorageEvent = (e) => {
      if (e.key === key) {
        try {
          setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch (error) {
          console.error(`Error parsing localStorage value:`, error);
        }
      }
    };

    window.addEventListener('local-storage-update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('local-storage-update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage and broadcasts the change
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Broadcast the change
      createStorageEvent(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Function to remove the key from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      // Broadcast the change
      createStorageEvent(key, initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Function to update a specific item in an array
  const updateItem = (itemId, newData, idField = 'id') => {
    try {
      if (Array.isArray(storedValue)) {
        const updatedValue = storedValue.map(item =>
          item[idField] === itemId ? { ...item, ...newData } : item
        );
        setStoredValue(updatedValue);
        window.localStorage.setItem(key, JSON.stringify(updatedValue));
        // Broadcast the change
        createStorageEvent(key, updatedValue);
        return true;
      } else if (typeof storedValue === 'object' && storedValue !== null) {
        // If data is an object with nested arrays
        const updatedValue = { ...storedValue };
        Object.keys(updatedValue).forEach(objKey => {
          if (Array.isArray(updatedValue[objKey])) {
            updatedValue[objKey] = updatedValue[objKey].map(item =>
              item[idField] === itemId ? { ...item, ...newData } : item
            );
          }
        });
        setStoredValue(updatedValue);
        window.localStorage.setItem(key, JSON.stringify(updatedValue));
        // Broadcast the change
        createStorageEvent(key, updatedValue);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating item in localStorage key "${key}":`, error);
      return false;
    }
  };

  return [storedValue, setValue, removeValue, updateItem];
};