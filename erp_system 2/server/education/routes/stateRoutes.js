const express = require('express');
const router = express.Router();
const stateController = require('../controllers/stateController');
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
router.get('/', stateController.getAllStates);
router.get('/:id', stateController.getState);
router.post('/', stateController.createState);
router.put('/:id', stateController.updateState);
router.delete('/:id', stateController.deleteState);
router.post('/upload', upload.single('file'), stateController.uploadExcel);

module.exports = router;