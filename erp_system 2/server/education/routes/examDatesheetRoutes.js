const express = require('express');
const router = express.Router();
const {
  getExamDatesheets,
  uploadExamDatesheet,
} = require('../controllers/examDatesheetController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.route('/').get(getExamDatesheets);
router.route('/upload').post(upload.single('file'), uploadExamDatesheet);

module.exports = router;