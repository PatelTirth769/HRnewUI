const express = require('express');
const router = express.Router();
const multer = require('multer');
const examCenterController = require('../controllers/manageExamCenterController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only Excel files are allowed!'));
    }
  }
});

// Routes
router.get('/', examCenterController.getAllExamCenters);
router.get('/:id', examCenterController.getExamCenter);
router.post('/', examCenterController.createExamCenter);
router.put('/:id', examCenterController.updateExamCenter);
router.delete('/:id', examCenterController.deleteExamCenter);
router.post('/upload', upload.single('file'), examCenterController.uploadExcel);

module.exports = router;