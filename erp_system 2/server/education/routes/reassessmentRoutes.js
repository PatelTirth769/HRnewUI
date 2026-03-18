const express = require('express');
const router = express.Router();
const reassessmentController = require('../controllers/reassessmentController');

// Get all reassessments
router.get('/', reassessmentController.getAllReassessments);

// Create a new reassessment
router.post('/', reassessmentController.createReassessment);

// Get reassessments by student
router.get('/student/:studentId', reassessmentController.getReassessmentsByStudent);

// Get pending reassessments
router.get('/pending', reassessmentController.getPendingReassessments);

// Assign faculty to reassessment
router.put('/:reassessmentId/assign-faculty/:facultyId', reassessmentController.assignFaculty);

// Update reassessment marks
router.put('/:reassessmentId/update-marks', reassessmentController.updateReassessmentMarks);

// Apply nearest marks
router.put('/:reassessmentId/apply-nearest-marks', reassessmentController.applyNearestMarks);

// Get faculty assigned reassessments
router.get('/faculty/:facultyId', reassessmentController.getFacultyReassessments);

// Upload Excel file
router.post('/upload-excel', reassessmentController.uploadExcel);

// Soft delete a reassessment
router.delete('/:id', reassessmentController.deleteReassessment);

module.exports = router;