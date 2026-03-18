import api from './api.js';

// Get all cities
export const getAllCities = async () => {
  try {
    const response = await api.get('/cities');
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

// Get cities by district
export const getCitiesByDistrict = async (districtId) => {
  try {
    const response = await api.get(`/cities/district/${districtId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching cities for district ${districtId}:`, error);
    throw error;
  }
};

// Get cities by state
export const getCitiesByState = async (stateId) => {
  try {
    const response = await api.get(`/cities/state/${stateId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching cities for state ${stateId}:`, error);
    throw error;
  }
};

// Get a single city
export const getCity = async (id) => {
  try {
    const response = await api.get(`/cities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching city with id ${id}:`, error);
    throw error;
  }
};

// Create a new city
export const createCity = async (cityData) => {
  try {
    const response = await api.post('/cities', cityData);
    return response.data;
  } catch (error) {
    console.error('Error creating city:', error);
    throw error;
  }
};

// Update a city
export const updateCity = async (id, cityData) => {
  try {
    const response = await api.put(`/cities/${id}`, cityData);
    return response.data;
  } catch (error) {
    console.error(`Error updating city with id ${id}:`, error);
    throw error;
  }
};

// Delete a city (soft delete)
export const deleteCity = async (id) => {
  try {
    const response = await api.delete(`/cities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting city with id ${id}:`, error);
    throw error;
  }
};

// Upload Excel file
export const uploadExcelFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/cities/upload', formData, {
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