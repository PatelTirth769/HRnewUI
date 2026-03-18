const express = require('express');
const router = express.Router();
const examGroupController = require('../controllers/examGroupController');

// Get all exam groups
router.get('/', examGroupController.getAllExamGroups);

// Create a new exam group
router.post('/', examGroupController.createExamGroup);

// Upload Excel file
router.post('/upload', examGroupController.uploadExcel);

// Get a single exam group
router.get('/:id', examGroupController.getExamGroup);

// Update an exam group
router.put('/:id', examGroupController.updateExamGroup);

// Soft delete an exam group
router.delete('/:id', examGroupController.deleteExamGroup);

// Toggle active status
router.patch('/:id/toggle-status', examGroupController.toggleActiveStatus);

module.exports = router;