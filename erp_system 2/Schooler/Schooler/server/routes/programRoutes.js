const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// सभी प्रोग्राम्स के लिए राउट
router.get('/', programController.getAllPrograms);

// नया प्रोग्राम बनाने के लिए राउट
router.post('/', programController.createProgram);

// ID से प्रोग्राम प्राप्त करने के लिए राउट
router.get('/:id', programController.getProgramById);

// प्रोग्राम अपडेट करने के लिए राउट
router.put('/:id', programController.updateProgram);

// प्रोग्राम हटाने के लिए राउट
router.delete('/:id', programController.deleteProgram);

module.exports = router;