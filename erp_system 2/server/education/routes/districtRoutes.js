const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Routes
router.get('/', districtController.getAllDistricts);
router.get('/state/:stateId', districtController.getDistrictsByState);
router.get('/:id', districtController.getDistrict);
router.post('/', districtController.createDistrict);
router.put('/:id', districtController.updateDistrict);
router.delete('/:id', districtController.deleteDistrict);
router.post('/upload', upload.single('file'), districtController.uploadExcel);

module.exports = router;