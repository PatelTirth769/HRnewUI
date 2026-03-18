import api from './api.js';

// Get all exam terms
export const getAllExamTerms = async () => {
  try {
    const response = await api.get('/examterms');
    return response.data;
  } catch (error) {
    console.error('Error fetching exam terms:', error);
    throw error;
  }
};

// Create a new exam term
export const createExamTerm = async (examTermData) => {
  try {
    const response = await api.post('/examterms', examTermData);
    return response.data;
  } catch (error) {
    console.error('Error creating exam term:', error);
    throw error;
  }
};

// Update an exam term
export const updateExamTerm = async (id, examTermData) => {
  try {
    const response = await api.put(`/examterms/${id}`, examTermData);
    return response.data;
  } catch (error) {
    console.error('Error updating exam term:', error);
    throw error;
  }
};

// Delete an exam term
export const deleteExamTerm = async (id) => {
  try {
    const response = await api.delete(`/examterms/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting exam term:', error);
    throw error;
  }
};

// Upload Excel file
export const uploadExcelFile = async (formData) => {
  try {
    const response = await api.post('/examterms/upload', formData, {
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