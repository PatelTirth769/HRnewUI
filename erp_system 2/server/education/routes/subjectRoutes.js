const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

// Get all subjects (mapped and unmapped)
router.get('/', subjectController.getAllSubjects);

// Get unmapped subjects
router.get('/unmapped', subjectController.getUnmappedSubjects);

// Fetch exam subjects from old system
router.get('/exam-subjects', subjectController.fetchExamSubjects);

// Fetch academic subjects from old system
router.get('/academic-subjects', subjectController.fetchAcademicSubjects);

// Map exam subject to academic subject
router.post('/map', subjectController.mapSubjects);

// Unmap subjects
router.patch('/unmap/:id', subjectController.unmapSubjects);

// Upload Excel file for bulk mapping
router.post('/upload', subjectController.uploadExcel);

// Download Excel template
router.get('/download-template', subjectController.downloadExcelTemplate);

// Download all subject mappings as Excel
router.get('/download', subjectController.downloadSubjectMappings);

module.exports = router;