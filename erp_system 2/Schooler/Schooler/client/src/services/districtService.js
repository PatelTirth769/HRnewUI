import api from './api.js';

// Get all districts
export const getAllDistricts = async () => {
  try {
    const response = await api.get('/districts');
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

// Get districts by state
export const getDistrictsByState = async (stateId) => {
  try {
    const response = await api.get(`/districts/state/${stateId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching districts for state ${stateId}:`, error);
    throw error;
  }
};

// Get a single district
export const getDistrict = async (id) => {
  try {
    const response = await api.get(`/districts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching district with id ${id}:`, error);
    throw error;
  }
};

// Create a new district
export const createDistrict = async (districtData) => {
  try {
    const response = await api.post('/districts', districtData);
    return response.data;
  } catch (error) {
    console.error('Error creating district:', error);
    throw error;
  }
};

// Update a district
export const updateDistrict = async (id, districtData) => {
  try {
    const response = await api.put(`/districts/${id}`, districtData);
    return response.data;
  } catch (error) {
    console.error(`Error updating district with id ${id}:`, error);
    throw error;
  }
};

// Delete a district (soft delete)
export const deleteDistrict = async (id) => {
  try {
    const response = await api.delete(`/districts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting district with id ${id}:`, error);
    throw error;
  }
};

// Upload Excel file
export const uploadExcelFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/districts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    throw error;
  }
};