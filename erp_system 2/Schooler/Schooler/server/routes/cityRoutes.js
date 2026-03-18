const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
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
router.get('/', cityController.getAllCities);
router.get('/district/:districtId', cityController.getCitiesByDistrict);
router.get('/state/:stateId', cityController.getCitiesByState);
router.get('/:id', cityController.getCity);
router.post('/', cityController.createCity);
router.put('/:id', cityController.updateCity);
router.delete('/:id', cityController.deleteCity);
router.post('/upload', upload.single('file'), cityController.uploadExcel);

module.exports = router;