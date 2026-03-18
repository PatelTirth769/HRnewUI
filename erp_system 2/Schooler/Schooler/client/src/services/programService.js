import api from './api.js';

// सभी प्रोग्राम्स प्राप्त करें
export const getAllPrograms = async () => {
  try {
    const response = await api.get('/programs');
    return response.data;
  } catch (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }
};

// नया प्रोग्राम बनाएं
export const createProgram = async (programData) => {
  try {
    const response = await api.post('/programs', programData);
    return response.data;
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

// प्रोग्राम को ID से प्राप्त करें
export const getProgramById = async (id) => {
  try {
    const response = await api.get(`/programs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching program with id ${id}:`, error);
    throw error;
  }
};

// प्रोग्राम को अपडेट करें
export const updateProgram = async (id, programData) => {
  try {
    const response = await api.put(`/programs/${id}`, programData);
    return response.data;
  } catch (error) {
    console.error(`Error updating program with id ${id}:`, error);
    throw error;
  }
};

// प्रोग्राम को हटाएं
export const deleteProgram = async (id) => {
  try {
    const response = await api.delete(`/programs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting program with id ${id}:`, error);
    throw error;
  }
};