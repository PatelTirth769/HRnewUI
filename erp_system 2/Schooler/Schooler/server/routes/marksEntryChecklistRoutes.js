const express = require('express');
const router = express.Router();
const marksEntryChecklistController = require('../controllers/marksEntryChecklistController');

router.get('/', marksEntryChecklistController.getChecklistData);
router.post('/upload', marksEntryChecklistController.uploadChecklistData);
router.get('/download', marksEntryChecklistController.downloadChecklistData);

module.exports = router;