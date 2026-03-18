const express = require('express');
const router = express.Router();
const yearConfigController = require('../controllers/yearConfigurationController');

// Get all year configurations
router.get('/', yearConfigController.getAllYearConfigurations);

// Get a single year configuration
router.get('/:id', yearConfigController.getYearConfigurationById);

// Create a new year configuration
router.post('/', yearConfigController.createYearConfiguration);

// Update a year configuration
router.put('/:id', yearConfigController.updateYearConfiguration);

// Delete a year configuration
router.delete('/:id', yearConfigController.deleteYearConfiguration);

// Toggle active status
router.patch('/:id/toggle-status', yearConfigController.toggleActiveStatus);

module.exports = router;