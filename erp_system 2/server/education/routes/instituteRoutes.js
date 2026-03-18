const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const instituteController = require('../controllers/instituteController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `institute-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Get all institutes
router.get('/', instituteController.getAllInstitutes);

// Get a single institute
router.get('/:id', instituteController.getInstituteById);

// Create a new institute
router.post('/', instituteController.createInstitute);

// Update an institute
router.put('/:id', instituteController.updateInstitute);

// Delete an institute (soft delete)
router.delete('/:id', instituteController.deleteInstitute);

// Upload Excel file
router.post('/upload', upload.single('file'), instituteController.uploadExcel);

module.exports = router;