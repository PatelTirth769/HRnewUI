const express = require('express');
const router = express.Router();
const multer = require('multer');
const degreeController = require('../controllers/degreeController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Routes
router.get('/', degreeController.getAllDegrees);
router.get('/:id', degreeController.getDegreeById);
router.post('/', degreeController.createDegree);
router.put('/:id', degreeController.updateDegree);
router.delete('/:id', degreeController.deleteDegree);
router.post('/upload', upload.single('file'), degreeController.uploadExcel);
router.get('/export/excel', degreeController.exportToExcel);

module.exports = router;