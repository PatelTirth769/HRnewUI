/**
 * Storage Service for handling localStorage operations
 * This service provides methods to store, retrieve, update and delete data in localStorage
 */

/**
 * Get data from localStorage
 * @param {string} key - The key to retrieve data from
 * @param {any} defaultValue - Default value to return if key doesn't exist
 * @returns {any} - The retrieved data or defaultValue
 */
export const getStorageData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting data from localStorage for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Set data in localStorage
 * @param {string} key - The key to store data under
 * @param {any} value - The data to store
 * @returns {boolean} - True if successful, false otherwise
 */
export const setStorageData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting data in localStorage for key ${key}:`, error);
    return false;
  }
};

/**
 * Update specific item in an array stored in localStorage
 * @param {string} key - The localStorage key
 * @param {string|number} itemId - The ID of the item to update
 * @param {object} newData - The new data to update with
 * @param {string} idField - The field name that contains the ID (default: 'id')
 * @returns {boolean} - True if successful, false otherwise
 */
export const updateStorageItem = (key, itemId, newData, idField = 'id') => {
  try {
    const data = getStorageData(key, []);
    if (Array.isArray(data)) {
      const updatedData = data.map(item => 
        item[idField] === itemId ? { ...item, ...newData } : item
      );
      return setStorageData(key, updatedData);
    } else if (typeof data === 'object' && data !== null) {
      // If data is an object with nested arrays (like tabContent)
      const updatedData = { ...data };
      Object.keys(updatedData).forEach(objKey => {
        if (Array.isArray(updatedData[objKey])) {
          updatedData[objKey] = updatedData[objKey].map(item => 
            item[idField] === itemId ? { ...item, ...newData } : item
          );
        }
      });
      return setStorageData(key, updatedData);
    }
    return false;
  } catch (error) {
    console.error(`Error updating item in localStorage for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete an item from an array stored in localStorage
 * @param {string} key - The localStorage key
 * @param {string|number} itemId - The ID of the item to delete
 * @param {string} idField - The field name that contains the ID (default: 'id')
 * @returns {boolean} - True if successful, false otherwise
 */
export const deleteStorageItem = (key, itemId, idField = 'id') => {
  try {
    const data = getStorageData(key, []);
    if (Array.isArray(data)) {
      const filteredData = data.filter(item => item[idField] !== itemId);
      return setStorageData(key, filteredData);
    } else if (typeof data === 'object' && data !== null) {
      // If data is an object with nested arrays (like tabContent)
      const updatedData = { ...data };
      Object.keys(updatedData).forEach(objKey => {
        if (Array.isArray(updatedData[objKey])) {
          updatedData[objKey] = updatedData[objKey].filter(item => item[idField] !== itemId);
        }
      });
      return setStorageData(key, updatedData);
    }
    return false;
  } catch (error) {
    console.error(`Error deleting item from localStorage for key ${key}:`, error);
    return false;
  }
};

/**
 * Add an item to an array stored in localStorage
 * @param {string} key - The localStorage key
 * @param {object} item - The item to add
 * @param {string} arrayKey - If the storage contains an object with arrays, specify the key for the array
 * @returns {boolean} - True if successful, false otherwise
 */
export const addStorageItem = (key, item, arrayKey = null) => {
  try {
    if (arrayKey) {
      // If we're adding to a specific array within an object
      const data = getStorageData(key, {});
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      data[arrayKey].push(item);
      return setStorageData(key, data);
    } else {
      // If we're adding directly to an array
      const data = getStorageData(key, []);
      if (Array.isArray(data)) {
        data.push(item);
        return setStorageData(key, data);
      }
    }
    return false;
  } catch (error) {
    console.error(`Error adding item to localStorage for key ${key}:`, error);
    return false;
  }
};

/**
 * Clear all data for a specific key in localStorage
 * @param {string} key - The key to clear
 * @returns {boolean} - True if successful, false otherwise
 */
export const clearStorageData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error clearing data from localStorage for key ${key}:`, error);
    return false;
  }
};