const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

// Get all faculties
router.get('/', facultyController.getAllFaculties);

// Create a new faculty
router.post('/', facultyController.createFaculty);

// Get a single faculty by ID
router.get('/:id', facultyController.getFacultyById);

// Update a faculty
router.put('/:id', facultyController.updateFaculty);

// Get faculties by department
router.get('/department/:department', facultyController.getFacultiesByDepartment);

// Get faculties by subject
router.get('/subject/:subjectId', facultyController.getFacultiesBySubject);

// Get available faculties for reassignment
router.get('/available/assign', facultyController.getAvailableFaculties);

// Upload Excel file
router.post('/upload-excel', facultyController.uploadExcel);

// Soft delete a faculty
router.delete('/:id', facultyController.deleteFaculty);

module.exports = router;