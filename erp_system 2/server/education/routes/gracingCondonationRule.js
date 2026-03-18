const express = require('express');
const router = express.Router();
const gracingCondonationRuleController = require('../controllers/gracingCondonationRuleController');

router.post('/', gracingCondonationRuleController.createGracingCondonationRule);
router.get('/', gracingCondonationRuleController.getGracingCondonationRules);

module.exports = router;