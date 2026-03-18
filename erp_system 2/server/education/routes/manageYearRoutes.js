const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const manageYearController = require('../controllers/manageYearController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
router.get('/', manageYearController.getActiveYears);
router.get('/all', manageYearController.getAllYears);
router.post('/', manageYearController.createYear);
router.put('/:id', manageYearController.updateYear);
router.patch('/:id/toggle', manageYearController.toggleYearStatus);
router.post('/upload', upload.single('file'), manageYearController.uploadExcel);

module.exports = router;