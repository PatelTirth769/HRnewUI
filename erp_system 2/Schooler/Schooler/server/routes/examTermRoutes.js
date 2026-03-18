const express = require('express');
const router = express.Router();
const examTermController = require('../controllers/examTermController');

// Get all exam terms
router.get('/', examTermController.getAllExamTerms);

// Create a new exam term
router.post('/', examTermController.createExamTerm);

// Get a single exam term by ID
router.get('/:id', examTermController.getExamTermById);

// Update an exam term
router.put('/:id', examTermController.updateExamTerm);

// Delete an exam term
router.delete('/:id', examTermController.deleteExamTerm);

// Upload Excel file
router.post('/upload', examTermController.uploadExcel);

module.exports = router;