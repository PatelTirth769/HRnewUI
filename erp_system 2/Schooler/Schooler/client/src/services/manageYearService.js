import api from './api.js';

// Get all active years
export const getYears = async () => {
  try {
    const response = await api.get('/manage-year');
    return response.data;
  } catch (error) {
    console.error('Error fetching years:', error);
    throw error;
  }
};

// Get all years including deleted ones
export const getAllYears = async () => {
  try {
    const response = await api.get('/manage-year/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching all years:', error);
    throw error;
  }
};

// Create a new year
export const createYear = async (yearData) => {
  try {
    const response = await api.post('/manage-year', yearData);
    return response.data;
  } catch (error) {
    console.error('Error creating year:', error);
    throw error;
  }
};

// Update an existing year
export const updateYear = async (id, yearData) => {
  try {
    const response = await api.put(`/manage-year/${id}`, yearData);
    return response.data;
  } catch (error) {
    console.error('Error updating year:', error);
    throw error;
  }
};

// Toggle year active status
export const toggleYearStatus = async (id) => {
  try {
    const response = await api.patch(`/manage-year/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling year status:', error);
    throw error;
  }
};

// Upload Excel file
export const uploadExcel = async (formData) => {
  try {
    const response = await api.post('/manage-year/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading Excel:', error);
    throw error;
  }
};

export default {
  getYears,
  getAllYears,
  createYear,
  updateYear,
  toggleYearStatus,
  uploadExcel
};